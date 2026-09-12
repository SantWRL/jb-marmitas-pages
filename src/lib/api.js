import { supabase } from './supabase.js';

// ---------- PRODUTOS ----------

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      promo_price: product.promo_price ?? null,
      out_of_stock: product.out_of_stock ?? false,
      image_url: product.image_url ?? 'assets/img/marmita-placeholder.svg'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id, changes) {
  const { data, error } = await supabase
    .from('products')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Envia a foto para o bucket "produtos" e retorna a URL pública.
// Retorna null se nenhum arquivo foi escolhido.
export async function uploadProductImage(file) {
  if (!file) return null;

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('produtos')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  return supabase.storage.from('produtos').getPublicUrl(path).data.publicUrl;
}

// ---------- PEDIDOS ----------

// OBS: aqui não usamos .select() depois do .insert(). O cliente que faz o
// pedido no site é sempre anônimo (anon), e a policy de SELECT em "orders"
// só libera para usuários autenticados (o admin). Se a gente pedisse pra
// ler a linha de volta logo após inserir, o Postgres barrava essa leitura
// e desfazia o insert inteiro, dando o erro de RLS. Por isso geramos o
// "id" e o "created_at" aqui no navegador mesmo, e devolvemos o objeto
// completo sem precisar ler nada de volta do banco.
export async function createOrder(order) {
  const newOrder = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    status: 'novo',
    customer_name: order.customer_name,
    customer_email: order.customer_email ?? null,
    delivery_type: order.delivery_type,
    address: order.address ?? null,
    reference: order.reference ?? null,
    cutlery: order.cutlery ?? false,
    payment_method: order.payment_method,
    payment_details: order.payment_details ?? null,
    total: order.total,
    items: order.items
  };

  const { error } = await supabase.from('orders').insert(newOrder);

  if (error) throw error;
  return newOrder;
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// ---------- AUTH ----------

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ---------- REALTIME ----------

export function subscribeToOrders(onChange) {
  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => onChange()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export function subscribeToProducts(onChange) {
  const channel = supabase
    .channel('products-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => onChange()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}