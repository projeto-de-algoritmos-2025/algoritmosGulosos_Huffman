import React, { useState, useEffect } from "react";
import { Tree, hierarchy } from "@visx/hierarchy";
import { Group } from "@visx/group";
import {
  Button,
  Paper,
  Typography,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

class Node {
  constructor(char, freq) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
    this.id = Math.random().toString(36).substring(2, 9);
  }
}

function buildHuffmanTree(freqMap) {
  // Inicia heap com nós folha
  let heap = Object.entries(freqMap).map(([char, freq]) => new Node(char, freq));
  heap.sort((a, b) => a.freq - b.freq);

  const steps = [];
  const queueStates = [];

  while (heap.length > 1) {
    queueStates.push([...heap]);

    const left = heap.shift();
    const right = heap.shift();

    const newNode = new Node(null, left.freq + right.freq);
    newNode.left = left;
    newNode.right = right;

    const idx = heap.findIndex((n) => n.freq > newNode.freq);
    if (idx === -1) heap.push(newNode);
    else heap.splice(idx, 0, newNode);

    steps.push({ newNode, left, right, queue: [...heap] });
  }

  queueStates.push([...heap]);
  return { root: heap[0], steps, queueStates };
}


function convertCumulativeTree(freqMap, steps, currentStep) {
    // Primeiro converte as folhas para visx nodes
    const leaves = Object.entries(freqMap).map(([char, freq]) => ({
      name: `${char}`,
      id: `leaf_${char}`,
      freq,
      children: [],
    }));
  
    const nodesMap = new Map(leaves.map((leaf) => [leaf.id, leaf]));
  
    // Cria nó pai visx (interno)
    function createParentNode(stepIndex) {
      if (stepIndex < 2 || stepIndex > steps.length + 1) return null;
      const step = steps[stepIndex - 2]; // índice correto
  
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
  
    // Criar os nós pais iniciais (freq) conectando as folhas, para passo 1
    if (currentStep === 1) {
      // Cada folha recebe um nó pai freq (subárvore de 2 níveis)
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
  
    // Passos 2 em diante, monta árvore cumulativa normalmente
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

function generateCodes(node, prefix = "", map = {}) {
  if (!node) return map;
  if (node.char !== null) {
    map[node.char] = prefix;
  } else {
    generateCodes(node.left, prefix + "0", map);
    generateCodes(node.right, prefix + "1", map);
  }
  return map;
}

export default function HuffmanTree() {
  const [inputText, setInputText] = useState("huffman animation example");
  const [freqMap, setFreqMap] = useState({});
  const [root, setRoot] = useState(null);
  const [steps, setSteps] = useState([]);
  const [queueStates, setQueueStates] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [codeMap, setCodeMap] = useState({});
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    const freq = {};
    for (const ch of inputText) {
      if (ch === " ") continue;
      freq[ch] = (freq[ch] || 0) + 1;
    }
    setFreqMap(freq);

    const { root, steps, queueStates } = buildHuffmanTree(freq);
    setRoot(root);
    setSteps(steps);
    setQueueStates(queueStates);
    setCurrentStep(0);
    setShowCodes(false);
    setCodeMap({});
    setProcessing(false);
  }, [inputText]);

  useEffect(() => {
    if (showCodes && root) {
      const codes = generateCodes(root);
      setCodeMap(codes);
    }
  }, [showCodes, root]);

  const handleNextStep = () => {
    if (processing) return;
  
    if (currentStep > steps.length + 1) {
      setShowCodes(true);
      return;
    }
  
    setProcessing(true);
    setTimeout(() => {
      setCurrentStep((s) => s + 1);
      setProcessing(false);
    }, 700);
  };  

  const currentQueue = currentStep < queueStates.length ? queueStates[currentStep] : [];

  const processingNodes =
    currentStep > 0 && currentStep <= steps.length
      ? [steps[currentStep - 1].left, steps[currentStep - 1].right]
      : [];

  // Construção cumulativa da árvore
  const treeData = currentStep === 0 ? null : convertCumulativeTree(freqMap, steps, currentStep);

  const safeTreeData = treeData
    ? {
        ...treeData,
        children: Array.isArray(treeData.children) ? treeData.children : [],
      }
    : null;

  return (
    <Box sx={{ padding: 2, maxWidth: 1000, margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Árvore de Huffman Interativa
      </Typography>

      <TextField
        label="Digite o texto para gerar a árvore"
        fullWidth
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        sx={{ mb: 3 }}
        disabled={processing}
      />

      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {/* Fila de Prioridade */}
        <Paper sx={{ flex: "1 1 250px", padding: 2, maxHeight: 300, overflowY: "auto" }}>
          <Typography variant="h6" gutterBottom>
            Fila de Prioridade
          </Typography>
          <List dense>
            {currentQueue.map((node) => (
              <ListItem
                key={node.id}
                sx={{
                  bgcolor: processingNodes.includes(node) ? "warning.light" : "transparent",
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemText
                  primary={node.char !== null ? `'${node.char}' : ${node.freq}` : `${node.freq}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Frequências Iniciais */}
        <Paper sx={{ flex: "1 1 250px", padding: 2, maxHeight: 300, overflowY: "auto" }}>
          <Typography variant="h6" gutterBottom>
            Frequências Iniciais
          </Typography>
          <List dense>
            {Object.entries(freqMap).map(([char, freq]) => (
              <ListItem key={char}>
                <ListItemText primary={`'${char}': ${freq}`} />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Códigos de Huffman */}
        <Paper
          sx={{
            flex: "1 1 250px",
            padding: 2,
            maxHeight: 300,
            overflowY: "auto",
            bgcolor: showCodes ? "success.light" : "grey.100",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Códigos de Huffman
          </Typography>
          {showCodes ? (
            <List dense>
              {Object.entries(codeMap).map(([char, code]) => (
                <ListItem key={char}>
                  <ListItemText primary={`'${char}': ${code}`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" variant="body2">
              (Clique em "Próximo passo" até o final para gerar os códigos)
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Árvore */}
      <Paper sx={{ marginTop: 4, padding: 2 }}>
        <svg width={800} height={400}>
          <Group top={40} left={50}>
            {safeTreeData ? (
              <Tree root={hierarchy(safeTreeData)} size={[700, 300]}>
              {(tree) =>
                tree.descendants().flatMap((node) => {
                  if (!node.data || !node.data.id) return [];
            
                  // Ignora o nó raiz "root" (id 'root')
                  if (node.data.id === "root") return [];
            
                  const isProcessing =
                    processingNodes.some((n) => n && n.id === node.data.id);
            
                  return (
                    <g
                      key={node.data.id}
                      transform={`translate(${node.x},${node.y})`}
                      style={{ transition: "all 0.5s ease" }}
                    >
                      <circle
                        r={20}
                        fill={Array.isArray(node.children) && node.children.length > 0 ? "#6495ED" : "#90EE90"}
                        stroke={isProcessing ? "#FFC107" : "#333"}
                        strokeWidth={isProcessing ? 4 : 1.5}
                      />
                      <text
                        dy=".33em"
                        fontSize={14}
                        fontWeight={Array.isArray(node.children) && node.children.length > 0 ? "bold" : "normal"}
                        textAnchor="middle"
                        fill="#000"
                      >
                        {node.data.name}
                      </text>
                      {node.parent && node.parent.data.id !== "root" && (() => {
                        const dx = node.parent.x - node.x;
                        const dy = node.parent.y - node.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const offsetX = (dx / dist) * 20;
                        const offsetY = (dy / dist) * 20;
                        return (
                          <line
                            x1={offsetX}
                            y1={offsetY}
                            x2={dx - offsetX}
                            y2={dy - offsetY}
                            stroke="#999"
                            strokeWidth={1.5}
                          />
                        );
                      })()}
                    </g>
                  );
                })
              }
            </Tree>            
            ) : (
              <text x={350} y={150} fill="#999" textAnchor="middle">
                Insira texto para gerar a árvore
              </text>
            )}
          </Group>
        </svg>
      </Paper>

      <Box sx={{ mt: 3, textAlign: "center" }}>
      <Button
            variant="contained"
            onClick={handleNextStep}
            disabled={processing}
            >
            {currentStep > steps.length + 1 ? "Mostrar Códigos" : "Próximo passo"}
      </Button>
      </Box>
    </Box>
  );
}
