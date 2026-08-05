/**
 * src/data/menuData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  FALLBACK OFFLINE ÚNICAMENTE — NO EDITAR PARA CAMBIAR PRECIOS O PRODUCTOS
 *
 * La fuente principal del menú es ahora Firestore:
 *   - Comidas Rápidas → colección `products` (session: "FAST_FOOD")
 *   - Almuerzos config → documento `menu_config/lunch_config`
 *   - Adicionales almuerzo → colección `products` (session: "LUNCH", type: "extra")
 *
 * Este archivo solo se usa si Firestore no está disponible (sin internet).
 * Para cambiar precios, platos o la configuración del almuerzo, edita directamente
 * en Firebase Console o desde el Panel de Administrador (próxima versión).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Datos del Negocio "Donde los Zambrano"
export const RESTAURANT_INFO = {
  name: "Donde los Zambrano",
  tagline: "Comidas Rápidas & Almuerzos Caseros",
  nit: "76320887-1",
  address: "CRA. 17 13B-15, Barrio San Rafael",
  phone: "300-6857271",
  whatsapp: "573006857271",
  currency: "COP",
};

// Menú Nocturno: Comidas Rápidas
export const FAST_FOOD_MENU = [
  {
    category: "Salchipapas",
    icon: " 🍟 ",
    items: [
      { id: "sp-1", name: "Salchipapa + Queso", price: 9900 },
      { id: "sp-2", name: "Salchipapa + Chicharrón", price: 11900 },
      { id: "sp-3", name: "Salchipapa + Chorizo", price: 11900 },
      { id: "sp-4", name: "Salchipapa + Tocineta", price: 11900 },
      { id: "sp-5", name: "Salchipapa + Pollo", price: 12900 },
      { id: "sp-6", name: "Salchipapa + Carne", price: 12900 },
      { id: "sp-7", name: "Salchipapa + Costilla", price: 15900 },
    ],
  },
  {
    category: "Salchipapas Armadas",
    icon: "🥩",
    subtitle: "Armala como quieras: Pollo, Carne, Chorizo, Tocineta, Chicharrón",
    items: [
      { id: "spa-1", name: "Salchipapa 2 Carnes Personal", price: 16900, description: "Elige 2 proteínas a elección + papas + salchicha" },
      { id: "spa-2", name: "Salchipapa 2 Carnes (2 Personas)", price: 21900, description: "Porción grande para compartir con 2 proteínas" },
      { id: "spa-3", name: "Salchipapa 3 Carnes Personal", price: 19900, description: "3 proteínas a elección + papas + salchicha" },
      { id: "spa-4", name: "Salchipapa 3 Carnes (2 Personas)", price: 26900, description: "Porción doble con 3 carnes seleccionadas" },
      { id: "spa-5", name: "Salchipapa 4 Carnes (3 Personas)", price: 36900, description: "Super combinación de 4 proteínas para 3 personas" },
      { id: "spa-6", name: "Salchipapa 5 Carnes (3 Personas)", price: 41900, description: "Banquete completo con todas las 5 carnes" },
    ],
  },
  {
    category: "Salchipapas Familiares",
    icon: "👨‍👩‍👧‍👦",
    items: [
      { id: "spf-1", name: "Salchipapa Familiar (4 personas)", price: 48900, description: "Gran bandeja familiar mixta para 4 personas" },
      { id: "spf-2", name: "Salchipapa Familiar Recomendada (4 personas)", price: 53900, description: "Bandeja especial con queso fundido y carnes extra" },
      { id: "spf-3", name: "Salchipapa Familiar (6 personas)", price: 62900, description: "Mega salchipapa para celebrar en grupo (6 personas)" },
      { id: "spf-4", name: "Salchipapa Familiar Recomendada (6 personas)", price: 69900, description: "La máxima experiencia familiar cargada con todo" },
    ],
  },
  {
    category: "Hamburguesas",
    icon: "🍔",
    items: [
      { id: "burg-1", name: "Burger Sencilla", price: 15900, description: "Carne artesanal, queso, lechuga, tomate y salsas de la casa" },
      { id: "burg-2", name: "Burger Pollo", price: 15900, description: "Pechuga desmechada o filete crocante con queso fundido" },
      { id: "burg-3", name: "Burger Doble Queso", price: 17900, description: "Carne artesanal bañada en doble capa de queso americano" },
      { id: "burg-4", name: "Burger del Rancho", price: 17900, description: "Carne, tocineta crocante, maicitos y salsa ranch" },
      { id: "burg-5", name: "Burger Doble Carne", price: 17900, description: "Doble porción de carne jugosa artesanal y queso" },
      { id: "burg-6", name: "Burger Pollo-Carne", price: 18900, description: "Mezcla suprema de carne artesanal y pollo" },
      { id: "burg-7", name: "Burger Carne-Tocineta", price: 18900, description: "Carne jugosa cargada con tocineta ahumada dorada" },
      { id: "burg-8", name: "Burger 2 Carnes + Doble Queso", price: 21900, description: "Doble carne artesanal y doble capa de queso derretido" },
    ],
  },
  {
    category: "Sándwiches",
    icon: "🥪",
    items: [
      { id: "sw-1", name: "Pollo + Queso", price: 15900, description: "Pan baguette tostado, pollo desmechado y queso" },
      { id: "sw-2", name: "Jamón + Queso", price: 15900, description: "Pan caliente con generoso jamón y queso fundido" },
      { id: "sw-3", name: "Hawaiano + Queso", price: 17900, description: "Jamón, queso derretido y dulce piña caribeña" },
      { id: "sw-4", name: "Pollo + Tocineta + Queso", price: 18900, description: "Pollo sazonado, tocineta crujiente y queso" },
      { id: "sw-5", name: "Pollo + Champiñón", price: 18900, description: "Pollo en salsa cremosita de champiñones" },
      { id: "sw-6", name: "Sándwich Caliche", price: 21900, description: "Especialidad de la casa con carnes mixtas, queso y vegetales" },
    ],
  },
  {
    category: "Hot Dogs",
    icon: "🌭",
    items: [
      { id: "hd-1", name: "Perro Sencillo", price: 10900, description: "Salchicha americana, ripio de papa y salsas" },
      { id: "hd-2", name: "Perro Sencillo + Queso", price: 12900, description: "Perro tradicional gratinado con queso fundido" },
      { id: "hd-3", name: "Perro Americano", price: 14900, description: "Salchicha jumbo, tocineta, maicitos y ripio" },
      { id: "hd-4", name: "Perro Americano + Queso", price: 15900, description: "Perro jumbo con tocineta, maíz y baño de queso gratinado" },
    ],
  },
  {
    category: "Adicionales",
    icon: "🥓",
    items: [
      { id: "adc-1", name: "Chorizo", price: 5000, description: "Porción de chorizo artesanal" },
      { id: "adc-2", name: "Tocineta", price: 5000, description: "Porción de tocineta ahumada" },
      { id: "adc-3", name: "Chicharrón", price: 6000, description: "Porción de chicharrón crocante" },
      { id: "adc-4", name: "Maíz", price: 4000, description: "Porción de maicitos tiernos" },
      { id: "adc-5", name: "Pollo", price: 7000, description: "Porción adicional de pollo" },
      { id: "adc-6", name: "Carne", price: 7000, description: "Porción adicional de carne" },
    ],
  },
  {
    category: "Bebidas",
    icon: "🥤",
    items: [
      { id: "beb-1", name: "Jugo Natural en Agua Personal", price: 6900, description: "Fruta fresca a elección (Maracuyá, Lulo, Mora, Mango)" },
      { id: "beb-2", name: "Jugo Natural en Leche Personal", price: 7900, description: "Jugo cremoso en leche fresca" },
      { id: "beb-3", name: "Limonada Natural Personal", price: 7900, description: "Limonada fría recién exprimida" },
      { id: "beb-4", name: "Jarra Jugo Natural en Agua", price: 11900, description: "Jarra familiar de jugo en agua" },
      { id: "beb-5", name: "Jarra Jugo Natural en Leche", price: 14900, description: "Jarra familiar cremosa en leche" },
      { id: "beb-6", name: "Jarra Limonada Natural", price: 14900, description: "Jarra familiar de limonada" },
      { id: "beb-7", name: "Gaseosa Personal", price: 6000, description: "Coca-Cola, Sprite, Premio 400ml" },
      { id: "beb-8", name: "Gaseosa Litro", price: 8500, description: "Gaseosa tamaño 1 Litro" },
      { id: "beb-9", name: "Gaseosa Litro y Medio", price: 10500, description: "Gaseosa familiar 1.5 Litros" },
      { id: "beb-10", name: "Hit Personal", price: 6000, description: "Jugo Hit caja/botella" },
      { id: "beb-11", name: "Hit Litro", price: 8000, description: "Jugo Hit envase de 1 Litro" },
    ],
  },
];

// Menú Diurno: Almuerzos Caseros del Día
export const LUNCH_MENU_DEFAULT = {
  priceBase: 15000,
  soups: ["Sopa de Sancocho de Costilla",
    "Consomé de Pollo con Verduras",
    "Ajiaco Santafereño",
    "Crema de Choclo",
    "Sin Sopa",
    "Sancocho de gineo",
  ],

  proteins: ["Carne Asada a la Plancha", "Pollo Sudado en Salsa Criolla", "Pechuga a la Plancha", "Lomo de Cerdo Dorado", "Pescado Frito Crujiente"],
  sidesOptions: [
    { label: "Arroz", options: ["Arroz Blanco", "Arroz con Coco", "Sin Arroz"] },
    { label: "Ensalada", options: ["Ensalada Verde de la Casa", "Ensalada Dulce con Piña", "Sin Ensalada"] },
    { label: "Grano/Acompañamiento", options: ["Frijoles Rojos", "Lentejas Guisadas", "Papa Salada", "Yuca al Vapor"] },
  ],
  drinks: ["Jugo de Maracuyá Natural", "Limonada de la Casa", "Claro de Maíz Helado"],
  extras: [
    { id: "le-1", name: "Extra Porción de Proteína", price: 7000 },
    { id: "le-2", name: "Sopa Extra", price: 3000 },
    { id: "le-3", name: "Porción de Aguacate", price: 3500 },
    { id: "le-4", name: "Huevos Fritos (2)", price: 3000 },
  ],
};
