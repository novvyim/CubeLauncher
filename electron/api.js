const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const driver = url.startsWith('https') ? https : http;
    driver
      .get(url, { headers: { 'User-Agent': 'CubeLauncher/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return httpGet(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const driver = url.startsWith('https') ? https : http;
    driver
      .get(url, { headers: { 'User-Agent': 'CubeLauncher/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return downloadFile(res.headers.location, destPath, onProgress).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
        let receivedBytes = 0;
        let lastReportedPercent = -1;
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        const file = fs.createWriteStream(destPath);
        res.on('data', (chunk) => {
          receivedBytes += chunk.length;
          if (totalBytes > 0 && onProgress) {
            const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
            if (pct !== lastReportedPercent) {
              lastReportedPercent = pct;
              onProgress(pct);
            }
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close((err) => {
            if (err) {
              fs.unlink(destPath, () => {});
              return reject(err);
            }
            if (onProgress) onProgress(100);
            resolve(destPath);
          });
        });
        file.on('error', (err) => {
          res.destroy();
          fs.unlink(destPath, () => {}); 
          reject(err);
        });
        res.on('error', (err) => {
          file.destroy();
          fs.unlink(destPath, () => {}); 
          reject(err);
        });
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {}); 
        reject(err);
      });
  });
}
async function getPaperDownload(mcVersion) {
  const base = 'https://api.papermc.io/v2/projects/paper';
  const buildsJson = await httpGet(`${base}/versions/${mcVersion}/builds`);
  const buildsData = JSON.parse(buildsJson);
  if (!buildsData.builds || buildsData.builds.length === 0) {
    throw new Error(`No Paper builds found for Minecraft ${mcVersion}`);
  }
  const latestBuild = buildsData.builds[buildsData.builds.length - 1];
  const buildNumber = latestBuild.build;
  const fileName = latestBuild.downloads?.application?.name
    ?? `paper-${mcVersion}-${buildNumber}.jar`;
  const url = `${base}/versions/${mcVersion}/builds/${buildNumber}/downloads/${fileName}`;
  return { url, fileName, build: buildNumber };
}
async function getFabricDownload(mcVersion) {
  const metaBase = 'https://meta.fabricmc.net/v2/versions';
  const loaderJson = await httpGet(`${metaBase}/loader`);
  const loaders = JSON.parse(loaderJson);
  const stableLoader = loaders.find((l) => l.stable) || loaders[0];
  const installerJson = await httpGet(`${metaBase}/installer`);
  const installers = JSON.parse(installerJson);
  const stableInstaller = installers.find((i) => i.stable) || installers[0];
  const loaderVer = stableLoader.version;
  const installerVer = stableInstaller.version;
  const fileName = `fabric-server-mc.${mcVersion}-loader.${loaderVer}-launcher.${installerVer}.jar`;
  const url = `${metaBase}/loader/${mcVersion}/${loaderVer}/${installerVer}/server/jar`;
  return { url, fileName };
}
const MODRINTH_BASE = 'https://api.modrinth.com/v2';
async function searchModrinth({ query, coreType, mcVersion, limit = 20, offset = 0 }) {
  const facets = [];
  if (coreType === 'paper') {
    facets.push(['categories:paper', 'categories:bukkit', 'categories:spigot']);
  } else if (coreType === 'fabric') {
    facets.push(['categories:fabric']);
  } else if (coreType === 'forge') {
    facets.push(['categories:forge']);
  }
  facets.push(['project_type:mod', 'project_type:plugin']);
  if (mcVersion) {
    facets.push([`versions:${mcVersion}`]);
  }
  const params = new URLSearchParams({
    query: query || '',
    limit: String(limit),
    offset: String(offset),
    facets: JSON.stringify(facets),
  });
  const raw = await httpGet(`${MODRINTH_BASE}/search?${params.toString()}`);
  const data = JSON.parse(raw);
  return {
    hits: (data.hits || []).map((h) => ({
      id: h.project_id || h.slug,
      slug: h.slug,
      name: h.title,
      author: h.author,
      description: h.description,
      downloads: h.downloads,
      iconUrl: h.icon_url,
      categories: h.categories,
      projectType: h.project_type,
    })),
    totalHits: data.total_hits || 0,
  };
}
async function getModrinthDownload(projectId, coreType, mcVersion) {
  const loaderMap = {
    paper: ['paper', 'bukkit', 'spigot'],
    fabric: ['fabric'],
    forge: ['forge'],
  };
  const loaders = loaderMap[coreType] || [coreType];
  const params = new URLSearchParams({
    loaders: JSON.stringify(loaders),
    game_versions: JSON.stringify([mcVersion]),
  });
  const raw = await httpGet(`${MODRINTH_BASE}/project/${projectId}/version?${params.toString()}`);
  const versions = JSON.parse(raw);
  if (!versions || versions.length === 0) {
    throw new Error(`No compatible version found for project "${projectId}" (${coreType} / ${mcVersion})`);
  }
  const version = versions[0];
  const primaryFile = version.files.find((f) => f.primary) || version.files[0];
  if (!primaryFile) {
    throw new Error(`Version ${version.id} has no downloadable files.`);
  }
  return {
    url: primaryFile.url,
    fileName: primaryFile.filename,
    versionId: version.id,
  };
}
async function getVanillaDownload(mcVersion) {
  const manifestRaw = await httpGet('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
  const manifest = JSON.parse(manifestRaw);
  const versionEntry = manifest.versions.find((v) => v.id === mcVersion);
  if (!versionEntry) {
    throw new Error(`Vanilla version "${mcVersion}" not found in Mojang manifest`);
  }
  const versionRaw = await httpGet(versionEntry.url);
  const versionData = JSON.parse(versionRaw);
  if (!versionData.downloads || !versionData.downloads.server) {
    throw new Error(`No server download available for Vanilla ${mcVersion}`);
  }
  const serverDl = versionData.downloads.server;
  const fileName = `server-${mcVersion}.jar`;
  return { url: serverDl.url, fileName };
}
async function getForgeDownload(mcVersion, build) {
  let versionStr = `${mcVersion}-${build}`;
  const oldVersions = ['1.8.9', '1.7.10', '1.7.2', '1.6.4'];
  if (oldVersions.includes(mcVersion)) {
    versionStr = `${mcVersion}-${build}-${mcVersion}`;
  }
  const url = `https://maven.minecraftforge.net/net/minecraftforge/forge/${versionStr}/forge-${versionStr}-installer.jar`;
  return { url, fileName: `forge-installer.jar`, build };
}

module.exports = {
  httpGet,
  downloadFile,
  getPaperDownload,
  getFabricDownload,
  getVanillaDownload,
  getForgeDownload,
  searchModrinth,
  getModrinthDownload,
};
