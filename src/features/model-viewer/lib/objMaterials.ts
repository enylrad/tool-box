/** The .mtl file names an OBJ file references through `mtllib` statements. */
export function findMaterialLibraries(objText: string) {
  const names: string[] = []
  for (const match of objText.matchAll(/^[ \t]*mtllib[ \t]+(.+?)[ \t]*$/gm)) {
    for (const name of match[1].split(/[ \t]+/)) {
      if (name && !names.includes(name)) names.push(name)
    }
  }
  return names
}
