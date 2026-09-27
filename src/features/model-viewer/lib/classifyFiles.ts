export type ModelFormat = 'glb' | 'gltf' | 'obj' | 'stl'

export interface ClassifiedFiles {
  /** The model file to open. */
  main: File
  format: ModelFormat
  /** Every other file that was dropped with it (materials, buffers, textures). */
  resources: File[]
}

/** Model formats in the order they are preferred when several are dropped together. */
const MODEL_FORMATS: readonly ModelFormat[] = ['glb', 'gltf', 'obj', 'stl']

/** 3D formats people commonly try that this viewer cannot open. */
const UNSUPPORTED_MODEL_FORMATS = new Set(['fbx', 'ply', 'dae', '3ds', 'blend', 'usdz', 'usd', 'max', 'c4d', '3mf'])

export const ACCEPTED_FILE_TYPES = '.obj,.mtl,.gltf,.glb,.stl,.bin,image/*,.ktx2'

/** Lower-case extension without the dot, or an empty string. */
export function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

/** Picks the model to open from a set of dropped files and keeps the rest as its resources. */
export function classifyFiles(files: readonly File[]): ClassifiedFiles {
  for (const format of MODEL_FORMATS) {
    const main = files.find((file) => extensionOf(file.name) === format)
    if (main) return { main, format, resources: files.filter((file) => file !== main) }
  }

  const unsupported = files.find((file) => UNSUPPORTED_MODEL_FORMATS.has(extensionOf(file.name)))
  if (unsupported) {
    throw new Error(
      `${extensionOf(unsupported.name).toUpperCase()} files are not supported. Export the model as glTF/GLB, OBJ or STL and try again.`,
    )
  }
  throw new Error('No 3D model found. Drop an .obj, .gltf, .glb or .stl file (optionally with its .mtl, .bin and texture files).')
}
