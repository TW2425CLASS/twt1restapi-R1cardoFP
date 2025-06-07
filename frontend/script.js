const API_URL = 'http://localhost:3000';

// Seletores dos modais e formulários
const alunoDialog = document.getElementById('alunoDialog');
const alunoForm = document.getElementById('alunoForm');
const fecharAlunoDialog = document.getElementById('fecharAlunoDialog');
const abrirAdicionarAluno = document.getElementById('abrirAdicionarAluno');

const cursoDialog = document.getElementById('cursoDialog');
const cursoForm = document.getElementById('cursoForm');
const fecharCursoDialog = document.getElementById('fecharCursoDialog');
const abrirAdicionarCurso = document.getElementById('abrirAdicionarCurso');

let cursosMap = {};

async function carregarCursosMap() {
  const response = await fetch(`${API_URL}/Curso`);
  const cursos = await response.json();
  cursosMap = {};
  cursos.forEach(curso => {
    cursosMap[curso._id] = curso.curso;
  });
}

// Carregar lista de alunos
async function carregarAlunos() {
  const alunosTable = document.querySelector('#alunosTable tbody');
  alunosTable.innerHTML = '';
  await carregarCursosMap(); // <-- carrega o mapa de cursos
  try {
    const response = await fetch(`${API_URL}/Aluno`);
    const alunos = await response.json();
    alunos.forEach(aluno => {
      const nomeCurso = cursosMap[aluno.curso] || '(curso apagado)';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${aluno.nome}</td>
        <td>${aluno.apelido}</td>
        <td>${nomeCurso}</td>
        <td>${aluno.anoCurricular || aluno.anocurso || '(sem ano)'}</td>
        <td>
          <button class="editarAluno" data-id="${aluno._id}">Editar</button>
          <button class="apagarAluno" data-id="${aluno._id}">Apagar</button>
        </td>
      `;
      alunosTable.appendChild(row);
    });

    // Eventos editar/apagar
    document.querySelectorAll('.editarAluno').forEach(btn => {
      btn.onclick = () => abrirModalEditarAluno(btn.getAttribute('data-id'));
    });
    document.querySelectorAll('.apagarAluno').forEach(btn => {
      btn.onclick = () => apagarAluno(btn.getAttribute('data-id'));
    });
  } catch (err) {
    alunosTable.innerHTML = '<tr><td colspan="5">Erro ao carregar alunos</td></tr>';
  }
}

// Carregar lista de cursos
async function carregarCursos() {
  const cursosTable = document.querySelector('#cursosTable tbody');
  cursosTable.innerHTML = '';
  try {
    const response = await fetch(`${API_URL}/Curso`);
    const cursos = await response.json();
    cursos.forEach(curso => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${curso.curso || '(sem nome)'}</td>
        <td>
          <button class="editarCurso" data-id="${curso._id}">Editar</button>
          <button class="apagarCurso" data-id="${curso._id}">Apagar</button>
        </td>
      `;
      cursosTable.appendChild(row);
    });

    // Eventos editar/apagar
    document.querySelectorAll('.editarCurso').forEach(btn => {
      btn.onclick = () => abrirModalEditarCurso(btn.getAttribute('data-id'));
    });
    document.querySelectorAll('.apagarCurso').forEach(btn => {
      btn.onclick = () => apagarCurso(btn.getAttribute('data-id'));
    });
  } catch (err) {
    cursosTable.innerHTML = '<tr><td colspan="2">Erro ao carregar cursos</td></tr>';
  }
}

// Preencher select de cursos no modal de aluno
async function preencherCursosSelect() {
  const select = document.getElementById('curso');
  select.innerHTML = '';
  try {
    const response = await fetch(`${API_URL}/Curso`);
    const cursos = await response.json();
    cursos.forEach(curso => {
      const option = document.createElement('option');
      option.value = curso._id; // <-- agora é o id
      option.textContent = curso.curso; // <-- mostra o nome
      select.appendChild(option);
    });
  } catch (err) {
    select.innerHTML = '<option>Erro ao carregar cursos</option>';
  }
}

// Abrir modal para adicionar aluno
abrirAdicionarAluno.onclick = async () => {
  alunoForm.reset();
  document.getElementById('alunoId').value = '';
  await preencherCursosSelect();
  alunoDialog.showModal();
};

// Abrir modal para editar aluno
async function abrirModalEditarAluno(id) {
  try {
    const response = await fetch(`${API_URL}/Aluno/${id}`);
    const aluno = await response.json();
    document.getElementById('alunoId').value = aluno._id;
    document.getElementById('nome').value = aluno.nome;
    document.getElementById('apelido').value = aluno.apelido;
    await preencherCursosSelect();
    document.getElementById('curso').value = aluno.curso; // agora é o id
    document.getElementById('anoCurricular').value = aluno.anoCurricular || aluno.anocurso;
    alunoDialog.showModal();
  } catch (err) {
    alert('Erro ao carregar aluno');
  }
}

// Salvar aluno (adicionar ou editar)
alunoForm.onsubmit = async (e) => {
  e.preventDefault();
  const alunoId = document.getElementById('alunoId').value;
  const aluno = {
    nome: document.getElementById('nome').value,
    apelido: document.getElementById('apelido').value,
    curso: document.getElementById('curso').value, // agora é o id do curso
    anoCurricular: parseInt(document.getElementById('anoCurricular').value)
  };
  try {
    if (alunoId) {
      await fetch(`${API_URL}/Aluno/${alunoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aluno)
      });
    } else {
      await fetch(`${API_URL}/Aluno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aluno)
      });
    }
    alunoDialog.close();
    carregarAlunos();
  } catch (err) {
    alert('Erro ao guardar aluno');
  }
};

// Apagar aluno
async function apagarAluno(id) {
  if (confirm('Tem certeza que deseja apagar este aluno?')) {
    await fetch(`${API_URL}/Aluno/${id}`, { method: 'DELETE' });
    carregarAlunos();
  }
}

// Fechar modal aluno
fecharAlunoDialog.onclick = () => alunoDialog.close();

// -------- CURSOS --------

// Abrir modal para adicionar curso
abrirAdicionarCurso.onclick = () => {
  cursoForm.reset();
  document.getElementById('cursoId').value = '';
  cursoDialog.showModal();
};

// Abrir modal para editar curso
async function abrirModalEditarCurso(id) {
  try {
    const response = await fetch(`${API_URL}/Curso/${id}`);
    const curso = await response.json();
    document.getElementById('cursoId').value = curso._id;
    document.getElementById('cursoNome').value = curso.curso;
    cursoDialog.showModal();
  } catch (err) {
    alert('Erro ao carregar curso');
  }
}

// Salvar curso (adicionar ou editar)
cursoForm.onsubmit = async (e) => {
  e.preventDefault();
  const cursoId = document.getElementById('cursoId').value;
  const cursoObj = {
    curso: document.getElementById('cursoNome').value
  };
  try {
    if (cursoId) {
      await fetch(`${API_URL}/Curso/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cursoObj)
      });
    } else {
      await fetch(`${API_URL}/Curso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cursoObj)
      });
    }
    cursoDialog.close();
    carregarCursos();
    carregarAlunos(); // <-- Adicione esta linha
    preencherCursosSelect();
  } catch (err) {
    alert('Erro ao guardar curso');
  }
};

// Apagar curso
async function apagarCurso(id) {
  if (confirm('Tem certeza que deseja apagar este curso?')) {
    await fetch(`${API_URL}/Curso/${id}`, { method: 'DELETE' });
    carregarCursos();
    preencherCursosSelect();
  }
}

// Fechar modal curso
fecharCursoDialog.onclick = () => cursoDialog.close();

// Inicialização
carregarAlunos();
carregarCursos();