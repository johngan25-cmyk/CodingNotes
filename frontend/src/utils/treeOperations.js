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
      const userInput = prompt(
        "Add a Single Link: Enter 'Name, URL'\nBulk Add: Paste a JSON array like [{'name':'Google', 'url':'google.com'}]"
      );
      
      if (!userInput) return null;
      const trimmedInput = userInput.trim();

      // 🔥 BULK UPLOAD PATH: Check if the input is a JSON array
      if (trimmedInput.startsWith("[") && trimmedInput.endsWith("]")) {
        try {
          const parsedArray = JSON.parse(trimmedInput);
          if (!Array.isArray(parsedArray)) throw new Error("Not an array");

          const createdNodes = [];

          // Loop through each item in the JSON and inject it into the tree
          parsedArray.forEach(item => {
            if (item.name && item.url) {
              const newLinkPath = `${targetFolder.fullPath}/${item.name}`.replace(/\/+/g, "/");
              
              const newLinkNode = {
                name: item.name,
                fullPath: newLinkPath,
                isDirectory: false,
                isLink: true,
                isNewUnsaved: true,
                destinationUrl: item.url,
              };

              insertNodeIntoTree(treeCopy, targetFolder.fullPath, newLinkNode);
              createdNodes.push(newLinkNode);
            }
          });

          if (createdNodes.length === 0) return null;

          setOpenFolders((prev) => ({ ...prev, [targetFolder.fullPath]: true }));
          
          // Return the new 'bulkNodes' array so the sidebar knows to fire the bulk API!
          return { 
            updatedTree: treeCopy, 
            targetSelection: createdNodes[0], // Focus the first link in the batch
            bulkNodes: createdNodes 
          };

        } catch (err) {
          alert("Invalid JSON format. Please ensure it is a valid array of objects.");
          return null;
        }
      }

      // 👤 SINGLE UPLOAD PATH: Fallback to the original comma-separated logic
      if (!userInput.includes(",")) return null;

      const [namePart, ...urlParts] = userInput.split(",");
      const name = namePart.trim();
      const url = urlParts.join(",").trim();

      if (!name || !url) return null;

      const newLinkPath = `${targetFolder.fullPath}/${name}`.replace(/\/+/g, "/");
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
