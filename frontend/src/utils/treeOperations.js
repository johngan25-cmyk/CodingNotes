/*
  treeOperations Utility Library
  A collection of pure JavaScript recursive algorithms designed to mutate nested JSON directory trees.
  Handles node insertion, leaf removal, and active parent folder target directory evaluation 
  outside of the React render loop.
*/

/**
 * Recursively checks if a path exists within the tree structure
 */
export const verifyPathExists = (node, targetPath) => {
  if (!node) return false;
  if (node.fullPath === targetPath) return true;
  if (node.children) {
    for (let child of node.children) {
      if (verifyPathExists(child, targetPath)) return true;
    }
  }
  return false;
};

// 🚀 Add this helper to recursively collect all file paths inside a node
const extractAllResources = (node, accumulator = { files: [], links: [] }) => {
  if (!node) return accumulator;
  
  if (!node.isDirectory) {
    if (node.isLink) {
      accumulator.links.push(node.fullPath);
    } else {
      accumulator.files.push(node.fullPath);
    }
  } else if (Array.isArray(node.children)) {
    node.children.forEach((child) => extractAllResources(child, accumulator));
  }
  
  return accumulator;
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
    const index = node.children.findIndex(
      (child) => child.fullPath === targetPath,
    );
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
            selectedNode.fullPath.lastIndexOf("/"),
          ),
        }
      : localTree;
  }
  return selectedNode;
};

/**
 * 🔥 Central Command Handler for Core Directory Tree Mutations
 */
export const executeTreeAction = ({
  actionType,
  localTree,
  selectedNode,
  setOpenFolders,
}) => {
  if (!localTree) return null;

  const targetFolder = resolveTargetFolder(selectedNode, localTree);
  const treeCopy = JSON.parse(JSON.stringify(localTree));

  switch (actionType) {
    case "ADD_FILE": {
      const name = prompt("Enter new file name (e.g., notes.md):");
      if (!name) return null;

      const newFilePath = `${targetFolder.fullPath}/${name}`.replace(
        /\/+/g,
        "/",
      );
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

      const newFolderPath = `${targetFolder.fullPath}/${name}`.replace(
        /\/+/g,
        "/",
      );
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
      if (
        !window.confirm(
          `Permanently delete "${selectedNode.name}" and all its contents?`,
        )
      )
        return null;

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
      const collectedResources = extractAllResources(targetNodeInTree);
      removeNodeFromTree(treeCopy, selectedNode.fullPath);

      return {
        updatedTree: treeCopy,
        targetSelection: null,
        shouldClearSelection: true,
        deletedFilePathsArray: collectedResources.files,  // Only files
        deletedLinkPathsArray: collectedResources.links,  // Only links
      };
    }

    case "COLLAPSE_ALL":
      setOpenFolders(localTree.fullPath ? { [localTree.fullPath]: true } : {});
      return null;

    case "ADD_LINK": {
      // 1. Ask for both inputs in one single prompt box
      const userInput = prompt(
        "Enter Link Title and URL separated by a comma\n(e.g., Project Docs, google.com):",
      );

      // Cancel if they hit escape or didn't use a comma
      if (!userInput || !userInput.includes(",")) return null;

      // 2. Split the input. (We join the URL parts back together just in case the URL itself contained commas!)
      const [namePart, ...urlParts] = userInput.split(",");
      const name = namePart.trim();
      const url = urlParts.join(",").trim();

      // Cancel if either part was left blank
      if (!name || !url) return null;

      const newLinkPath = `${targetFolder.fullPath}/${name}`.replace(
        /\/+/g,
        "/",
      );

      const newLinkNode = {
        name,
        fullPath: newLinkPath,
        isDirectory: false,
        isLink: true,
        isNewUnsaved: true,
        destinationUrl: url,
      };

      insertNodeIntoTree(treeCopy, targetFolder.fullPath, newLinkNode);
      setOpenFolders((prev) => ({ ...prev, [targetFolder.fullPath]: true }));

      return { updatedTree: treeCopy, targetSelection: newLinkNode };
    }

    default:
      return null;
  }
};
