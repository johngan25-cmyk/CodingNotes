/*
  treeOperations Utility Library
  A collection of pure JavaScript recursive algorithms designed to mutate nested JSON directory trees.
  Handles node insertion, leaf removal, and active parent folder target directory evaluation 
  outside of the React render loop.
*/

// 🚀 Add this helper to recursively collect all file paths inside a node
const extractAllFilePaths = (node, pathAccumulator = []) => {
  if (!node) return pathAccumulator;
  if (!node.isDirectory) {
    pathAccumulator.push(node.fullPath);
  } else if (Array.isArray(node.children)) {
    node.children.forEach(child => extractAllFilePaths(child, pathAccumulator));
  }
  return pathAccumulator;
};

/**
 * Recursively injects a new node into a specified target directory
 */
export const insertNodeIntoTree = (node, parentPath, newNode) => {
  if (node.fullPath === parentPath) {
    if (!node.children) node.children = [];
    node.children.push(newNode);
    return true;
  }
  if (node.children) {
    for (let child of node.children) {
      if (insertNodeIntoTree(child, parentPath, newNode)) return true;
    }
  }
  return false;
};

/**
 * Recursively locates and deletes a targeted file node signature
 */
export const removeNodeFromTree = (node, targetPath) => {
  if (node.children) {
    const index = node.children.findIndex((child) => child.fullPath === targetPath);
    if (index !== -1) {
      node.children.splice(index, 1);
      return true;
    }
    for (let child of node.children) {
      if (removeNodeFromTree(child, targetPath)) return true;
    }
  }
  return false;
};

/**
 * Evaluates context nodes to establish valid parent directory scope anchor tags
 */
export const resolveTargetFolder = (selectedNode, localTree) => {
  if (!selectedNode || !selectedNode.isDirectory) {
    return selectedNode && !selectedNode.isDirectory
      ? {
          fullPath: selectedNode.fullPath.substring(
            0,
            selectedNode.fullPath.lastIndexOf("/")
          ),
        }
      : localTree;
  }
  return selectedNode;
};

/**
 * 🔥 Central Command Handler for Core Directory Tree Mutations
 */
export const executeTreeAction = ({ actionType, localTree, selectedNode, setOpenFolders }) => {
  if (!localTree) return null;

  const targetFolder = resolveTargetFolder(selectedNode, localTree);
  const treeCopy = JSON.parse(JSON.stringify(localTree));

  switch (actionType) {
    case "ADD_FILE": {
      const name = prompt("Enter new file name (e.g., notes.md):");
      if (!name) return null;

      const newFilePath = `${targetFolder.fullPath}/${name}`.replace(/\/+/g, "/");
      const newFileNode = {
        name,
        fullPath: newFilePath,
        isDirectory: false,
        isNewUnsaved: true,
      };

      insertNodeIntoTree(treeCopy, targetFolder.fullPath, newFileNode);
      setOpenFolders((prev) => ({ ...prev, [targetFolder.fullPath]: true }));


      return { updatedTree: treeCopy, targetSelection: newFileNode };
    }

    case "ADD_FOLDER": {
      const name = prompt("Enter new folder name:");
      if (!name) return null;

      const newFolderPath = `${targetFolder.fullPath}/${name}`.replace(/\/+/g, "/");
      const newFolderNode = {
        name,
        fullPath: newFolderPath,
        isDirectory: true,
        children: [],
      };

      insertNodeIntoTree(treeCopy, targetFolder.fullPath, newFolderNode);
      setOpenFolders((prev) => ({ ...prev, [targetFolder.fullPath]: true }));
      return { updatedTree: treeCopy, targetSelection: null };
    }

    case "DELETE": {
      if (!selectedNode || selectedNode.name === "root") return null;
      if (!window.confirm(`Permanently delete "${selectedNode.name}" and all its contents?`)) return null;

      const treeCopy = JSON.parse(JSON.stringify(localTree));
      
      // Find the actual node inside the current tree to scrape its structural branches
      const findNodeByPath = (root, targetPath) => {
        if (root.fullPath === targetPath) return root;
        if (root.children) {
          for (let child of root.children) {
            const found = findNodeByPath(child, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const targetNodeInTree = findNodeByPath(treeCopy, selectedNode.fullPath);
      
      // Gather every single file path nested inside this item (or just the file path if it's a file)
      const collectedPaths = extractAllFilePaths(targetNodeInTree);

      removeNodeFromTree(treeCopy, selectedNode.fullPath);
      
      return { 
        updatedTree: treeCopy, 
        targetSelection: null, 
        shouldClearSelection: true,
        // 🚀 Forward the array of paths up to the component controller
        deletedFilePathsArray: collectedPaths
      };
    }

    case "COLLAPSE_ALL":
      setOpenFolders(localTree.fullPath ? { [localTree.fullPath]: true } : {});
      return null;

    default:
      return null;
  }
};