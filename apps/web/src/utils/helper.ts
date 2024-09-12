export function mergePath(...args: string[]) {
  let finalPath = '';

  for (let index = 0; index < args.length; index += 1) {
    let currPath = args[index];

    if (currPath.startsWith('/')) {
      currPath = currPath.slice(1);
    }

    const isLast = index === args.length - 1;
    const hasTrailing = currPath.endsWith('/');
    if (!hasTrailing && !isLast) {
      currPath = `${currPath}/`;
    } else if (hasTrailing && isLast) {
      currPath = currPath.slice(0, -1);
    }

    finalPath += currPath;
  }

  return finalPath;
}
