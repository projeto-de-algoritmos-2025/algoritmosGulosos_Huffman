// utils/HuffmanUtils.js

export class Node {
  constructor(char, freq) {
    this.char = char;
    this.children = [];
    this.freq = freq;
    this.left = null;
    this.right = null;
    this.id = Math.random().toString(36).substring(2, 9);
  }
}

export function buildHuffmanTree(freqMap) {
  let heap = Object.entries(freqMap).map(([char, freq]) => new Node(char, freq));
  heap.sort((a, b) => a.freq - b.freq);

  const steps = [];
  const queueStates = [[], heap.map((n) => ({ ...n }))]; // snapshot da heap inicial
  console.log(queueStates)

  while (heap.length > 1) {
    const left = heap.shift();
    const right = heap.shift();

    const newNode = new Node(null, left.freq + right.freq);
    newNode.left = left;
    newNode.right = right;
    const leftChar = left.char !== null ? ["'"+left.char+"'"] : left.children;
    const rightChar = right.char !== null ? ["'"+right.char+"'"] : right.children;
    newNode.children = [...leftChar, ...rightChar];

    const idx = heap.findIndex((n) => n.freq > newNode.freq);
    if (idx === -1) heap.push(newNode);
    else heap.splice(idx, 0, newNode);

    steps.push({ newNode, left, right, queue: [...heap] });
    queueStates.push([...heap]); // snapshot após inserção
  }

  return { root: heap[0], steps, queueStates };
}

export function generateCodes(node, prefix = "", map = {}) {
  if (!node) return map;
  if (node.char !== null) {
    map[node.char] = prefix;
  } else {
    generateCodes(node.left, prefix + "0", map);
    generateCodes(node.right, prefix + "1", map);
  }
  return map;
}

export function convertCumulativeTree(freqMap, steps, currentStep) {
  const leaves = Object.entries(freqMap).map(([char, freq]) => ({
    name: `${char}`,
    id: `leaf_${char}`,
    freq,
    children: [],
  }));

  const nodesMap = new Map(leaves.map((leaf) => [leaf.id, leaf]));

  function createParentNode(stepIndex) {
    if (stepIndex < 2 || stepIndex > steps.length + 1) return null;
    const step = steps[stepIndex - 2];

    const getVisxNode = (node) => {
      if (node.char !== null) {
        const id = `leaf_${node.char}`;
        if (!nodesMap.has(id)) {
          nodesMap.set(id, {
            name: `${node.char}`,
            id,
            freq: node.freq,
            children: [],
          });
        }
        return nodesMap.get(id);
      } else {
        const id = `internal_${node.id}`;
        if (nodesMap.has(id)) return nodesMap.get(id);

        const leftVisx = getVisxNode(node.left);
        const rightVisx = getVisxNode(node.right);

        const newNode = {
          name: `${node.freq}`,
          id,
          freq: node.freq,
          children: [leftVisx, rightVisx],
        };
        nodesMap.set(id, newNode);
        return newNode;
      }
    };

    return getVisxNode(step.newNode);
  }

  if (currentStep === 1) {
    const forest = leaves.map((leaf) => ({
      id: `parent_${leaf.id}`,
      name: `${leaf.freq}`,
      freq: leaf.freq,
      children: [leaf],
    }));

    return {
      id: "root",
      name: "Árvore Huffman",
      freq: 0,
      children: forest,
    };
  }

  const root = {
    id: "root",
    name: "Árvore Huffman",
    freq: 0,
    children: [...leaves],
  };

  for (let i = 2; i <= currentStep; i++) {
    const parent = createParentNode(i);
    if (parent) {
      parent.children.forEach((child) => {
        const idx = root.children.findIndex((c) => c.id === child.id);
        if (idx !== -1) root.children.splice(idx, 1);
      });
      root.children.push(parent);
    }
  }

  return root;
}
