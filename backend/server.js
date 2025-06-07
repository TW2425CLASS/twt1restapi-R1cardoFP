// API real a ser implementada

const express = require('express');
const cors = require('cors'); // ADICIONE ESTA LINHA
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors()); // ADICIONE ESTA LINHA
app.use(express.json()); // Para aceitar JSON no corpo das requisições

const port = 3000;
const MONGO_URI = 'mongodb+srv://rfilipepereira:rfilipepereira@tw.byfvnhr.mongodb.net/?retryWrites=true&w=majority&appName=TW';
const DB_NAME = 'Academicos';



MongoClient.connect(MONGO_URI)
.then(client => {
    db = client.db(DB_NAME);
    alunosCollection = db.collection('Aluno');
    cursosCollection = db.collection('Curso');
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:3000`);
    });
}
)
.catch(error => {
    console.error('Erro ao conectar ao MongoDB:', error);
});
app.get('/Aluno', async (req, res) => {
  try {
    const alunos = await alunosCollection.find().toArray();
    // Converter _id para string
    alunos.forEach(a => a._id = a._id.toString());
    res.json(alunos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar alunos' });
  }
});
app.get('/Curso', async (req, res) => {
  try {
    const cursos = await cursosCollection.find().toArray();
    cursos.forEach(c => c._id = c._id.toString());
    res.json(cursos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar cursos' });
  }
});

// Rotas CRUD para Aluno

// Criar novo aluno
app.post('/Aluno', async (req, res) => {
  try {
    const result = await alunosCollection.insertOne(req.body);
    res.status(201).json({ _id: result.insertedId, ...req.body });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar aluno' });
  }
});

// Buscar por ID (Aluno ou Curso)
app.get('/Aluno/:id', async (req, res) => {
  try {
    let aluno;
    if (/^[a-f\d]{24}$/i.test(req.params.id)) {
      aluno = await alunosCollection.findOne({ _id: new ObjectId(req.params.id) });
    }
    if (!aluno) {
      aluno = await alunosCollection.findOne({ _id: req.params.id });
    }
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado' });
    res.json(aluno);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar aluno' });
  }
});

// Editar por ID
app.put('/Aluno/:id', async (req, res) => {
  try {
    let result;
    if (/^[a-f\d]{24}$/i.test(req.params.id)) {
      result = await alunosCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
    } else {
      result = await alunosCollection.updateOne(
        { _id: req.params.id },
        { $set: req.body }
      );
    }
    if (result.matchedCount === 0) return res.status(404).json({ erro: 'Aluno não encontrado' });
    res.json({ msg: 'Aluno atualizado' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar aluno' });
  }
});

// Apagar por ID
app.delete('/Aluno/:id', async (req, res) => {
  try {
    let result;
    if (/^[a-f\d]{24}$/i.test(req.params.id)) {
      result = await alunosCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    } else {
      result = await alunosCollection.deleteOne({ _id: req.params.id });
    }
    if (result.deletedCount === 0) return res.status(404).json({ erro: 'Aluno não encontrado' });
    res.json({ msg: 'Aluno apagado' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao apagar aluno' });
  }
});

// Rotas CRUD para Curso

// Criar novo curso
app.post('/Curso', async (req, res) => {
  if (!req.body.curso) {
    return res.status(400).json({ erro: 'O campo curso é obrigatório.' });
  }
  try {
    const result = await cursosCollection.insertOne({ curso: req.body.curso });
    res.status(201).json({ _id: result.insertedId, curso: req.body.curso });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar curso' });
  }
});

// Buscar curso por ID
app.get('/Curso/:id', async (req, res) => {
  try {
    let curso;
    if (/^[a-f\d]{24}$/i.test(req.params.id)) {
      curso = await cursosCollection.findOne({ _id: new ObjectId(req.params.id) });
    }
    if (!curso) {
      curso = await cursosCollection.findOne({ _id: req.params.id });
    }
    if (!curso) return res.status(404).json({ erro: 'Curso não encontrado' });
    res.json(curso);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar curso' });
  }
});

// Editar curso
app.put('/Curso/:id', async (req, res) => {
  try {
    // 1. Buscar o curso antigo
    let cursoAntigo;
    if (/^[a-f\d]{24}$/i.test(req.params.id)) {
      cursoAntigo = await cursosCollection.findOne({ _id: new ObjectId(req.params.id) });
    } else {
      cursoAntigo = await cursosCollection.findOne({ _id: req.params.id });
    }
    if (!cursoAntigo) return res.status(404).json({ erro: 'Curso não encontrado' });

    // 2. Atualizar o curso
    let result;
    if (/^[a-f\d]{24}$/i.test(req.params.id)) {
      result = await cursosCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { curso: req.body.curso.trim() } }
      );
    } else {
      result = await cursosCollection.updateOne(
        { _id: req.params.id },
        { $set: { curso: req.body.curso.trim() } }
      );
    }

    // 3. Atualizar todos os alunos que tinham o nome antigo do curso (ignorando espaços/vírgulas)
    await alunosCollection.updateMany(
      { curso: { $regex: `^${cursoAntigo.curso}\\s*,?$`, $options: 'i' } },
      { $set: { curso: req.body.curso.trim() } }
    );

    res.json({ msg: 'Curso e alunos atualizados' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar curso' });
  }
});

// Apagar curso
app.delete('/Curso/:id', async (req, res) => {
  try {
    let result;
    if (/^[a-f\d]{24}$/i.test(req.params.id)) {
      result = await cursosCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    } else {
      result = await cursosCollection.deleteOne({ _id: req.params.id });
    }
    if (result.deletedCount === 0) return res.status(404).json({ erro: 'Curso não encontrado' });
    res.json({ msg: 'Curso apagado' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao apagar curso' });
  }
});
