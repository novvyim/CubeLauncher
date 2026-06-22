export type CoreId = "vanilla" | "paper" | "forge" | "fabric"
export type ServerCore = {
  id: CoreId
  name: string
  tagline: string
  content: "plugins" | "mods" | null
}
export const CORES: ServerCore[] = [
  { id: "vanilla", name: "Vanilla", tagline: "Pure, unmodified Minecraft", content: null },
  { id: "paper", name: "Paper", tagline: "High-performance plugins", content: "plugins" },
  { id: "forge", name: "Forge", tagline: "The modding standard", content: "mods" },
  { id: "fabric", name: "Fabric", tagline: "Lightweight & modern", content: "mods" },
]
export type VersionRow = {
  version: string
  latest?: boolean
  cores: Record<CoreId, { available: boolean; build?: string }>
}
export const VERSIONS: VersionRow[] = [
  {
    version: "1.21.4",
    latest: true,
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#412" },
      forge: { available: true, build: "54.1.0" },
      fabric: { available: true, build: "0.16.9" },
    },
  },
  {
    version: "1.21.1",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#133" },
      forge: { available: true, build: "52.0.2" },
      fabric: { available: true, build: "0.16.5" },
    },
  },
  {
    version: "1.20.4",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#499" },
      forge: { available: true, build: "49.1.0" },
      fabric: { available: true, build: "0.15.11" },
    },
  },
  {
    version: "1.20.1",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#196" },
      forge: { available: true, build: "47.3.0" },
      fabric: { available: true, build: "0.15.0" },
    },
  },
  {
    version: "1.19.2",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#307" },
      forge: { available: true, build: "43.4.0" },
      fabric: { available: false },
    },
  },
  {
    version: "1.18.2",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#388" },
      forge: { available: true, build: "40.2.0" },
      fabric: { available: false },
    },
  },
  {
    version: "1.16.5",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#794" },
      forge: { available: true, build: "36.2.42" },
      fabric: { available: false },
    },
  },
  {
    version: "1.12.2",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#1620" },
      forge: { available: true, build: "14.23.5.2860" },
      fabric: { available: false },
    },
  },
  {
    version: "1.8.9",
    cores: {
      vanilla: { available: true },
      paper: { available: true, build: "#445" },
      forge: { available: true, build: "11.15.1.2318" },
      fabric: { available: false },
    },
  },
]
export type StoreItem = {
  id: string
  name: string
  author: string
  category: string
  downloads: string
  rating: number
  description: string
  installed?: boolean
}
export const PLUGINS: StoreItem[] = [
  { id: "essentialsx", name: "EssentialsX", author: "EssentialsX Team", category: "Admin Tools", downloads: "48.2M", rating: 4.9, description: "The essential suite of commands and tools for any server.", installed: true },
  { id: "luckperms", name: "LuckPerms", author: "Luck", category: "Permissions", downloads: "31.7M", rating: 4.9, description: "A modern, fast permissions plugin with a web editor." },
  { id: "worldedit", name: "WorldEdit", author: "EngineHub", category: "World", downloads: "27.4M", rating: 4.8, description: "In-game map editor for sculpting massive builds fast." },
  { id: "vault", name: "Vault", author: "MilkBowl", category: "Economy", downloads: "22.1M", rating: 4.7, description: "Abstraction layer for economy & permission plugins." },
  { id: "protocollib", name: "ProtocolLib", author: "dmulloy2", category: "Library", downloads: "19.8M", rating: 4.6, description: "Intercept and modify packets for advanced plugins." },
  { id: "viaversion", name: "ViaVersion", author: "ViaVersion", category: "Compatibility", downloads: "18.3M", rating: 4.8, description: "Let newer clients join older server versions seamlessly." },
]
export const MODS: StoreItem[] = [
  { id: "jei", name: "Just Enough Items", author: "mezz", category: "Utility", downloads: "350M", rating: 4.9, description: "View items and recipes for everything in your modpack.", installed: true },
  { id: "create", name: "Create", author: "simibubi", category: "Tech", downloads: "120M", rating: 5.0, description: "Build mechanical contraptions and aesthetic machines." },
  { id: "jade", name: "Jade", author: "Snownee", category: "Information", downloads: "190M", rating: 4.8, description: "Shows information about whatever you're looking at." },
  { id: "sodium", name: "Sodium", author: "CaffeineMC", category: "Performance", downloads: "210M", rating: 5.0, description: "Modern rendering engine that drastically boosts FPS." },
  { id: "fabricapi", name: "Fabric API", author: "FabricMC", category: "Library", downloads: "400M", rating: 4.9, description: "Core hooks and interoperability for Fabric mods." },
  { id: "appleskin", name: "AppleSkin", author: "squeek502", category: "Utility", downloads: "150M", rating: 4.7, description: "Adds hunger and saturation info to the HUD." },
]
export type FileNode = {
  name: string
  type: "folder" | "file"
  children?: FileNode[]
  ext?: string
}
export const FILE_TREE: FileNode[] = [
  {
    name: "plugins",
    type: "folder",
    children: [
      { name: "EssentialsX.jar", type: "file", ext: "jar" },
      { name: "LuckPerms.jar", type: "file", ext: "jar" },
      { name: "config.yml", type: "file", ext: "yml" },
    ],
  },
  {
    name: "world",
    type: "folder",
    children: [
      { name: "level.dat", type: "file", ext: "dat" },
      { name: "region", type: "folder", children: [] },
      { name: "playerdata", type: "folder", children: [] },
    ],
  },
  {
    name: "world_nether",
    type: "folder",
    children: [{ name: "level.dat", type: "file", ext: "dat" }],
  },
  {
    name: "logs",
    type: "folder",
    children: [
      { name: "latest.log", type: "file", ext: "log" },
      { name: "2024-12-01.log.gz", type: "file", ext: "gz" },
    ],
  },
  { name: "server.properties", type: "file", ext: "properties" },
  { name: "eula.txt", type: "file", ext: "txt" },
  { name: "ops.json", type: "file", ext: "json" },
  { name: "whitelist.json", type: "file", ext: "json" },
  { name: "server.jar", type: "file", ext: "jar" },
]
export const SERVER_PROPERTIES = `#Minecraft server properties
#Generated by CubeForge
level-name=world
motd=A CubeForge Server
server-port=25565
max-players=20
online-mode=true
pvp=true
difficulty=normal
gamemode=survival
view-distance=10
simulation-distance=10
spawn-protection=16
enable-command-block=false
allow-flight=false
white-list=false
`
