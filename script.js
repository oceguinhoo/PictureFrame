const supabase = supabase.createClient(
  'https://mdalupngrwaoovowcxng.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWx1cG5ncndhb292b3djeG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTgzNzQsImV4cCI6MjA1OTc5NDM3NH0.AUT0e-RQA3UMFuHJLeR3vCq2m93kvWImHV_88Iew9Xk'
);

let currentUser = null;

async function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const hash = btoa(password);

  const { error } = await supabase.from('profiles').insert([{ username, senha_hash: hash }]);

  if (error) return alert('Erro no cadastro: ' + error.message);
  alert('Cadastro realizado!');
}

async function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const hash = btoa(password);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .eq('senha_hash', hash)
    .single();

  if (error || !data) return alert('Usuário ou senha inválidos.');
  currentUser = data;
  document.getElementById('auth').style.display = 'none';
  document.getElementById('upload').style.display = 'block';
  loadGallery();
}

async function uploadImage() {
  const file = document.getElementById('image-file').files[0];
  const descricao = document.getElementById('image-description').value;

  if (!file || !currentUser) return alert('Faça login e selecione uma imagem.');

  const path = `${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('fotos').upload(path, file);

  if (uploadError) return alert('Erro ao enviar: ' + uploadError.message);

  const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(path);

  const { error: insertError } = await supabase.from('fotos').insert([
    {
      url: publicUrl,
      descricao,
      user_id: currentUser.id
    }
  ]);

  if (insertError) return alert('Erro ao salvar imagem: ' + insertError.message);

  alert('Imagem enviada!');
  loadGallery();
}

async function loadGallery() {
  const { data, error } = await supabase
    .from('fotos')
    .select('url, descricao, user_id')
    .order('id', { ascending: false });

  if (error) return console.error(error);

  const div = document.getElementById('photos');
  div.innerHTML = '';

  data.forEach(foto => {
    const container = document.createElement('div');
    container.className = 'photo-card';

    const img = document.createElement('img');
    img.src = foto.url;

    const desc = document.createElement('p');
    desc.textContent = foto.descricao || '';

    container.appendChild(img);
    container.appendChild(desc);
    div.appendChild(container);
  });
}
