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



import {
  Node,
  buildHuffmanTree,
  convertCumulativeTree,
  generateCodes,
} from "./HuffmanUtils"; 

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
                  primary={node.char !== null ? `'${node.char}' : ${node.freq}` : ` [${node.children}]: ${node.freq}`}
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
