export const CREATIVE_CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'blocks', label: 'Blocos' },
    { id: 'nature', label: 'Natureza' },
    { id: 'building', label: 'Construcao' },
    { id: 'decoration', label: 'Decoracao' },
    { id: 'redstone', label: 'Redstone' },
    { id: 'tools_combat', label: 'Ferramentas/Combate' },
    { id: 'food', label: 'Comida' },
    { id: 'items', label: 'Itens' },
    { id: 'mobs', label: 'Mobs/Ovos' },
    { id: 'recent', label: 'Recentes' }
];

// Como adicionar novos itens:
// 1) Inclua um objeto em ITEMS_DB com id unico, category e tags para busca.
// 2) Defina stackSize/placeable/itemType conforme o comportamento esperado.
// 3) Garanta item correspondente em uiBuilder.itemDefs para exibir icon automaticamente.
const C = {
    blocks: 'blocks',
    nature: 'nature',
    building: 'building',
    decoration: 'decoration',
    redstone: 'redstone',
    tools: 'tools_combat',
    food: 'food',
    items: 'items'
};

export const ITEMS_DB = [
    { id: 1, name: 'Grama', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['grass', 'bloco'] },
    { id: 2, name: 'Terra', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['dirt', 'solo'] },
    { id: 3, name: 'Pedra', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['stone'] },
    { id: 4, name: 'Madeira', category: C.building, stackSize: 64, placeable: true, itemType: 'block', tags: ['log', 'mad'] },
    { id: 5, name: 'Folha', category: C.nature, stackSize: 64, placeable: true, itemType: 'block', tags: ['leaves', 'folhas'] },
    { id: 6, name: 'Agua', category: C.nature, stackSize: 64, placeable: true, itemType: 'block', tags: ['water'] },
    { id: 7, name: 'Areia', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['sand'] },
    { id: 8, name: 'Tabua', category: C.building, stackSize: 64, placeable: true, itemType: 'block', tags: ['planks'] },
    { id: 9, name: 'Bancada', category: C.building, stackSize: 64, placeable: true, itemType: 'block', tags: ['crafting', 'mesa'] },
    { id: 10, name: 'Minerio de Carvao', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['carvao', 'ore'] },
    { id: 11, name: 'Minerio de Ferro', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['ferro', 'ore'] },
    { id: 12, name: 'Minerio de Ouro', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['ouro', 'ore'] },
    { id: 13, name: 'Minerio de Diamante', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['diamante', 'ore'] },
    { id: 14, name: 'Pedregulho', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['cobblestone'] },
    { id: 15, name: 'Graveto', category: C.items, stackSize: 64, placeable: false, itemType: 'item', tags: ['stick'] },
    { id: 18, name: 'Grama Curta', category: C.nature, stackSize: 64, placeable: true, itemType: 'item', tags: ['natureza'] },
    { id: 19, name: 'Papoula', category: C.nature, stackSize: 64, placeable: true, itemType: 'item', tags: ['flor'] },
    { id: 20, name: 'Dente de Leao', category: C.nature, stackSize: 64, placeable: true, itemType: 'item', tags: ['flor'] },
    { id: 21, name: 'Centaurea', category: C.nature, stackSize: 64, placeable: true, itemType: 'item', tags: ['flor'] },
    { id: 22, name: 'Fornalha', category: C.building, stackSize: 64, placeable: true, itemType: 'block', tags: ['smelter'] },
    { id: 23, name: 'Bloco de Carvao', category: C.building, stackSize: 64, placeable: true, itemType: 'block', tags: ['carvao'] },
    { id: 25, name: 'Neve', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['snow'] },
    { id: 31, name: 'Granito', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['stone'] },
    { id: 32, name: 'Diorito', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['stone'] },
    { id: 33, name: 'Andesito', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['stone'] },
    { id: 34, name: 'Ardosia', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['deepslate'] },
    { id: 35, name: 'Minerio de Cobre', category: C.blocks, stackSize: 64, placeable: true, itemType: 'block', tags: ['cobre', 'ore'] },
    { id: 40, name: 'La Branca', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 41, name: 'La Laranja', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 42, name: 'La Magenta', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 43, name: 'La Azul Claro', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 44, name: 'La Amarela', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 45, name: 'La Lima', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 46, name: 'La Rosa', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 47, name: 'La Cinza', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 48, name: 'La Cinza Claro', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 49, name: 'La Ciano', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 50, name: 'La Roxa', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 51, name: 'La Azul', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 52, name: 'La Marrom', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 53, name: 'La Verde', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 54, name: 'La Vermelha', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 55, name: 'La Preta', category: C.decoration, stackSize: 64, placeable: true, itemType: 'block', tags: ['wool', 'la'] },
    { id: 56, name: 'Minerio de Redstone', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['redstone'] },
    { id: 57, name: 'Bloco de Redstone', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['redstone'] },
    { id: 58, name: 'Po Redstone Bloco', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['redstone', 'po'] },
    { id: 59, name: 'Tocha Redstone', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['redstone', 'torch'] },
    { id: 61, name: 'Lampada Redstone', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['redstone', 'lampada'] },
    { id: 63, name: 'Alavanca', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['lever'] },
    { id: 65, name: 'Repetidor', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['repeater'] },
    { id: 67, name: 'Comparador', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['comparator'] },
    { id: 69, name: 'Pistao', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['piston'] },
    { id: 70, name: 'Pistao Pegajoso', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['sticky'] },
    { id: 71, name: 'Distribuidor', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['dispenser'] },
    { id: 72, name: 'Dropador', category: C.redstone, stackSize: 64, placeable: true, itemType: 'block', tags: ['dropper'] },
    { id: 'picareta', name: 'Picareta', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['tool', 'pickaxe'] },
    { id: 'machado', name: 'Machado', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['axe'] },
    { id: 'picareta_pedra', name: 'Picareta de Pedra', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['tool'] },
    { id: 'machado_pedra', name: 'Machado de Pedra', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['tool'] },
    { id: 'picareta_ferro', name: 'Picareta de Ferro', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['tool'] },
    { id: 'machado_ferro', name: 'Machado de Ferro', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['tool'] },
    { id: 'picareta_diamante', name: 'Picareta de Diamante', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['tool'] },
    { id: 'machado_diamante', name: 'Machado de Diamante', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['tool'] },
    { id: 'pa', name: 'Pa de Madeira', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['shovel', 'pa'] },
    { id: 'pa_pedra', name: 'Pa de Pedra', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['shovel', 'pa'] },
    { id: 'pa_ferro', name: 'Pa de Ferro', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['shovel', 'pa'] },
    { id: 'pa_diamante', name: 'Pa de Diamante', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['shovel', 'pa'] },
    { id: 'tesoura', name: 'Tesoura', category: C.tools, stackSize: 1, placeable: false, itemType: 'tool', tags: ['shears'] },
    { id: 'carvao', name: 'Carvao', category: C.items, stackSize: 64, placeable: false, itemType: 'item', tags: ['combustivel'] },
    { id: 'barra_ferro', name: 'Barra de Ferro', category: C.items, stackSize: 64, placeable: false, itemType: 'item', tags: ['ingot'] },
    { id: 'barra_ouro', name: 'Barra de Ouro', category: C.items, stackSize: 64, placeable: false, itemType: 'item', tags: ['ingot'] },
    { id: 'carne_vaca_assada', name: 'Bife', category: C.food, stackSize: 64, placeable: false, itemType: 'food', tags: ['comida', 'beef'] },
    { id: 'carne_porco_assada', name: 'Porco Assado', category: C.food, stackSize: 64, placeable: false, itemType: 'food', tags: ['comida', 'pork'] },
    { id: 'frango_assado', name: 'Frango Assado', category: C.food, stackSize: 64, placeable: false, itemType: 'food', tags: ['comida', 'chicken'] },
    { id: 'carneirinho_assado', name: 'Mutton Assado', category: C.food, stackSize: 64, placeable: false, itemType: 'food', tags: ['comida', 'mutton'] },
    { id: 'redstone', name: 'Po de Redstone', category: C.redstone, stackSize: 64, placeable: false, itemType: 'item', tags: ['redstone', 'po'] }
];

export function resolveItemsWithIcons(itemDefs = {}, catalog = ITEMS_DB) {
    return catalog.map((item) => ({
        ...item,
        icon: itemDefs[item.id]?.svgBase || null
    }));
}

export function explainItemsDBExtension() {
    return 'Para adicionar novos itens no criativo, inclua um objeto em ITEMS_DB com id unico, category, tags e stackSize. Se o id existir em uiBuilder.itemDefs, o icon e aplicado automaticamente.';
}
