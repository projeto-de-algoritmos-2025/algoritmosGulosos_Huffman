import pygame
import heapq
from collections import defaultdict

# Inicialização do pygame
pygame.init()
WIDTH, HEIGHT = 1400, 800  # Aumentei o tamanho para acomodar a fila
WIN = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Árvore de Huffman - Animação")

FONT = pygame.font.SysFont('Arial', 20)
LARGE_FONT = pygame.font.SysFont('Arial', 24)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREEN = (100, 200, 100)  # folhas
BLUE = (100, 100, 255)   # internos
GRAY = (200, 200, 200)
RED = (255, 100, 100)
YELLOW = (255, 255, 100)  # para destacar os nós sendo processados

# Botão
BUTTON_RECT = pygame.Rect(WIDTH - 200, HEIGHT - 60, 160, 40)

class Node:
    def __init__(self, char, freq):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None
        self.x = 0
        self.y = 0
        self.width = 0  # Largura da subárvore

    def __lt__(self, other):
        return self.freq < other.freq

    def draw_mini(self, x, y, highlight=False):
        color = YELLOW if highlight else (GREEN if self.char else BLUE)
        pygame.draw.circle(WIN, color, (x, y), 15)
        pygame.draw.circle(WIN, BLACK, (x, y), 15, 1)
        label = f"{self.char}:{self.freq}" if self.char else f"{self.freq}"
        text = FONT.render(label, True, BLACK)
        WIN.blit(text, (x - text.get_width() // 2, y - text.get_height() // 2))

def build_huffman_tree(freq_map):
    heap = [Node(char, freq) for char, freq in freq_map.items()]
    heapq.heapify(heap)
    steps = []
    queue_states = []  # Armazena o estado da fila em cada passo

    while len(heap) > 1:
        # Salva o estado atual da fila antes de processar
        queue_states.append(heap.copy())
        
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        new_node = Node(None, left.freq + right.freq)
        new_node.left = left
        new_node.right = right
        heapq.heappush(heap, new_node)
        steps.append((new_node, left, right, heap.copy()))
    
    # Adiciona o estado final
    queue_states.append(heap.copy())
    return heap[0], steps, queue_states

def calculate_node_positions(node, x, y, level=0):
    if node is None:
        return 0
    
    left_width = calculate_node_positions(node.left, x, y + 100, level + 1)
    right_width = calculate_node_positions(node.right, x + left_width + 50, y + 100, level + 1)
    
    node.width = left_width + right_width + 50 if (left_width or right_width) else 50
    
    if node.left and node.right:
        node.x = (node.left.x + node.right.x) // 2
    elif node.left:
        node.x = node.left.x
    elif node.right:
        node.x = node.right.x
    else:
        node.x = x + node.width // 2
    
    node.y = y
    
    return node.width

def generate_codes(node, prefix="", code_map=None):
    if code_map is None:
        code_map = {}
    if node.char:
        code_map[node.char] = prefix
    else:
        generate_codes(node.left, prefix + "0", code_map)
        generate_codes(node.right, prefix + "1", code_map)
    return code_map

def draw_node(node):
    if node is None:
        return
    
    color = GREEN if node.char else BLUE
    label = f"{node.char}:{node.freq}" if node.char else f"{node.freq}"
    
    pygame.draw.circle(WIN, color, (node.x, node.y), 25)
    pygame.draw.circle(WIN, BLACK, (node.x, node.y), 25, 2)
    text = FONT.render(label, True, BLACK)
    WIN.blit(text, (node.x - text.get_width() // 2, node.y - text.get_height() // 2))
    
    if node.left:
        pygame.draw.line(WIN, BLACK, (node.x, node.y + 25), (node.left.x, node.left.y - 25), 2)
        draw_node(node.left)
    if node.right:
        pygame.draw.line(WIN, BLACK, (node.x, node.y + 25), (node.right.x, node.right.y - 25), 2)
        draw_node(node.right)

def draw_button():
    pygame.draw.rect(WIN, GRAY, BUTTON_RECT)
    pygame.draw.rect(WIN, BLACK, BUTTON_RECT, 2)
    text = FONT.render("Próximo passo", True, BLACK)
    WIN.blit(text, (BUTTON_RECT.x + 20, BUTTON_RECT.y + 10))

def draw_frequencies(freq_map):
    title = LARGE_FONT.render("Frequências Iniciais:", True, BLACK)
    WIN.blit(title, (WIDTH - 300, 20))
    
    y_offset = 50
    for i, (char, freq) in enumerate(sorted(freq_map.items())):
        label = f"'{char}': {freq}"
        text = FONT.render(label, True, BLACK)
        WIN.blit(text, (WIDTH - 300, y_offset + i * 25))

def draw_codes(code_map, show=False):
    title = LARGE_FONT.render("Códigos Huffman:", True, BLACK)
    WIN.blit(title, (WIDTH - 300, 200))
    
    if show:
        y_offset = 230
        for i, (char, code) in enumerate(sorted(code_map.items())):
            label = f"'{char}': {code}"
            text = FONT.render(label, True, RED)
            WIN.blit(text, (WIDTH - 300, y_offset + i * 25))
    else:
        text = FONT.render("(será exibido no final)", True, GRAY)
        WIN.blit(text, (WIDTH - 300, 230))

def draw_queue(queue, step, processing_nodes=None):
    if processing_nodes is None:
        processing_nodes = []
    
    title = LARGE_FONT.render("Fila de Prioridade:", True, BLACK)
    WIN.blit(title, (WIDTH - 300, 400))
    
    # Desenha os nós na fila
    x_start = WIDTH - 300
    y_pos = 450
    
    for i, node in enumerate(queue):
        # Verifica se este nó está sendo processado no momento
        highlight = node in processing_nodes
        node.draw_mini(x_start + i * 60, y_pos, highlight)
        
        # Se for um nó interno, desenha conexões com filhos
        if node.left and node.right:
            pygame.draw.line(WIN, BLACK, 
                           (x_start + i * 60, y_pos + 15), 
                           (x_start + i * 60 - 30, y_pos + 60), 1)
            pygame.draw.line(WIN, BLACK, 
                           (x_start + i * 60, y_pos + 15), 
                           (x_start + i * 60 + 30, y_pos + 60), 1)
            
            # Desenha os filhos abaixo
            node.left.draw_mini(x_start + i * 60 - 30, y_pos + 90)
            node.right.draw_mini(x_start + i * 60 + 30, y_pos + 90)

def main():
    running = True
    text = "huffman animation example"
    freq_map = defaultdict(int)
    for ch in text:
        if ch != ' ':
            freq_map[ch] += 1

    root, steps, queue_states = build_huffman_tree(freq_map)
    code_map = generate_codes(root)
    clock = pygame.time.Clock()

    current_step = 0
    built_nodes = []
    show_codes = False
    processing_nodes = []  # Nós sendo combinados no passo atual

    while running:
        WIN.fill(WHITE)

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if BUTTON_RECT.collidepoint(event.pos):
                    if current_step < len(steps):
                        # Atualiza os nós sendo processados
                        _, left, right, _ = steps[current_step]
                        processing_nodes = [left, right]
                        
                        # Avança para o próximo passo após um pequeno delay
                        pygame.time.delay(500)
                        node, left, right, _ = steps[current_step]
                        built_nodes.append(node)
                        current_step += 1
                        processing_nodes = []
                    else:
                        show_codes = True

        # Desenha a árvore principal
        if built_nodes:
            calculate_node_positions(built_nodes[-1], 100, 100)
            draw_node(built_nodes[-1])
        elif current_step == len(steps):  # Árvore completa
            calculate_node_positions(root, 100, 100)
            draw_node(root)
            show_codes = True

        # Desenha a fila de prioridade
        if current_step < len(queue_states):
            queue = queue_states[current_step]
            
            # Se estamos no meio de um passo, mostra quais nós estão sendo processados
            if processing_nodes:
                draw_queue(queue, current_step, processing_nodes)
            else:
                draw_queue(queue, current_step)
        else:
            draw_queue(queue_states[-1], current_step)

        draw_button()
        draw_frequencies(freq_map)
        draw_codes(code_map, show_codes)
        
        # Mostra instruções
        if current_step < len(steps):
            instruction = FONT.render(f"Passo {current_step+1}/{len(steps)}: Combinando nós", True, BLACK)
        else:
            instruction = FONT.render("Árvore completa! Clique para ver os códigos.", True, BLACK)
        WIN.blit(instruction, (20, HEIGHT - 30))
        
        pygame.display.update()
        clock.tick(30)

    pygame.quit()

if __name__ == "__main__":
    main()