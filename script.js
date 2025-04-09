const supabase = window.supabase.createClient(
  'https://mdalupngrwaoovowcxng.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWx1cG5ncndhb292b3djeG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTgzNzQsImV4cCI6MjA1OTc5NDM3NH0.AUT0e-RQA3UMFuHJLeR3vCq2m93kvWImHV_88Iew9Xk'
);

let currentUser = null;
let fotosExibidas = 0;
const fotosPorPagina = 9;

document.getElementById('theme-toggle').onclick = () => {
  document.body.classList.toggle('dark-mode');
};

document.getElementById('logout-btn').onclick = () => {
  localStorage.removeItem('currentUser');
  location.reload();
};

window.onload = async () => {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser = JSON.parse(stored);
    document.getElementById('auth').style.display = 'none';
    document.getElementById('upload').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'inline-block';
    loadGallery();
  }
};

async function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;
  const hash = btoa(password);

  const { error } = await supabase.from('profiles').insert([
    { username, senha_hash: hash }
  ]);

  if (error) {
    alert('Erro no cadastro: ' + error.message);
  } else {
    alert('Cadastro realizado com sucesso!');
  }
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

  if (error || !data) {
    alert('Usuário ou senha inválidos.');
  } else {
    currentUser = data;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('auth').style.display = 'none';
    document.getElementById('upload').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'inline-block';
    loadGallery();
  }
}

async function uploadImage() {
  const file = document.getElementById('image-file').files[0];
  const descricao = document.getElementById('image-description').value;

  if (!file || !currentUser) {
    alert('Selecione uma imagem e faça login.');
    return;
  }

  const filePath = `${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('fotos')
    .upload(filePath, file);

  if (uploadError) {
    alert('Erro ao enviar imagem: ' + uploadError.message);
    return;
  }

  const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(filePath);

  const { error: insertError } = await supabase.from('fotos').insert([
    {
      url: urlData.publicUrl,
      descricao,
      user_id: currentUser.id
    }
  ]);

  if (insertError) {
    alert('Erro ao salvar os dados.');
  } else {
    alert('Imagem enviada com sucesso!');
    fotosExibidas = 0;
    loadGallery(true);
  }
}

async function loadGallery(recarregar = false) {
  if (recarregar) {
    document.getElementById('photos').innerHTML = '';
    fotosExibidas = 0;
  }

  const { data, error } = await supabase
    .from('fotos')
    .select(`
      id,
      url,
      descricao,
      user_id,
      profiles(username)
    `)
    .order('id', { ascending: false })
    .range(fotosExibidas, fotosExibidas + fotosPorPagina - 1);

  if (error) {
    console.error(error);
    return;
  }

  if (data.length === fotosPorPagina) {
    document.getElementById('load-more').style.display = 'block';
  } else {
    document.getElementById('load-more').style.display = 'none';
  }

  const photosDiv = document.getElementById('photos');
  data.forEach(foto => {
    const div = document.createElement('div');
    div.className = 'photo-card';

    const user = document.createElement('p');
    user.textContent = `@${foto.profiles.username}`;

    const img = document.createElement('img');
    img.src = foto.url;

    const desc = document.createElement('p');
    desc.textContent = foto.descricao || '';

    div.appendChild(user);
    div.appendChild(img);
    div.appendChild(desc);

    if (foto.user_id === currentUser.id) {
      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.textContent = 'X';
      del.onclick = () => deleteImage(foto.id, foto.url);
      div.appendChild(del);
    }

    photosDiv.appendChild(div);
  });

  fotosExibidas += data.length;
}

async function loadMore() {
  loadGallery();
}

async function deleteImage(id, url) {
  const path = url.split('/').pop();
  await supabase.storage.from('fotos').remove([path]);
  await supabase.from('fotos').delete().eq('id', id);
  fotosExibidas = 0;
  loadGallery(true);
}
