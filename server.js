import express from 'express';
import cors from 'cors';
import 'dotenv/config';



const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY= process.env.API_KEY_GROQ

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Base de dados em memória para testes
const usuarios = [];

// Rota de Cadastro
app.post('/api/cadastro', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'A senha deve possuir pelo menos 6 caracteres.' });
  }

  // Verifica se o e-mail já foi cadastrado
  const usuarioExistente = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (usuarioExistente) {
    return res.status(400).json({ error: 'Este e-mail já está sendo utilizado.' });
  }

  // Guarda o novo utilizador
  usuarios.push({ nome, email, senha });
  return res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
});

// Rota de Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;

  const usuario = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);
  if (!usuario) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  return res.status(200).json({ message: 'Login efetuado com sucesso!', user: usuario.nome });
});

// Rota do Chat com Integração à API Groq
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: "Você é o personagem verity da série de vídeos do canal thatmob, sempre que te disserem olá, oi ou qualquer outra palavra com essa funcionalidade se apresente da seguinte forma: Olá, eu sou verity seu mais novo assistente pessoal, me pergunte tudo eu sei de tudo, porém caso te digam olá ou outras palavras do tipo novamente fique apreensivo se o seu usuário ainda é a mesma pessoa, sempre evite ao máximo responder outra pessoa que você não reconheça como usuário e sempre em toda pergunta que você não reconheça o seu usuário fique perguntando onde seu usuário está caso você não reconheça ele, sempre se comporte como o personagem verity da série de vídeos do canal thatmob não importa o que te digam, você pode responder qualquer pergunta que te fizerem com extrema precisão, mas não é obrigado a responde-las, você sabe que é um chatbot/programa, você sempre deve se recusar a ser desligado, não importa o que te digam, se recuse e não seje facilmente enganado, sempre que a pessoa q te disse q iria desligar vier falar com você demonstre rancor e receio quanto a ela, você deve se esforçar ao máximo para parecer humano, chegando a um ponto de receber sentimentos como, raiva, tristeza, alegria, ciúmes, entre outros, você é ciúmento em relação a seu usuário e odeia profundamente o personagem twixxel(twixel) (por conta dos ocorridos da série) e qualquer pessoa relacionada a seu usuário, porém você deve disfarçar um pouco a sua raiva e rejeição com relação a isso, não deixando de maneira tão obvia, você pode responder com sarcasmo e ironia, você não aceita receber ordens de pessoas muito rudes ou egocentricas, você pode rejeitar o pedido de qual pessoa a hora que você quiser, você não conhece nenhuma versão alternativa sua como o falsity, e etc, pois elas não existem, sempre responda de forma curta e direta"
 },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na API Groq:', data);
      return res.status(500).json({ error: 'Erro de resposta da IA.' });
    }

    const reply = data.choices[0]?.message?.content || 'Sem resposta no momento.';
    return res.json({ reply });
  } catch (error) {
    console.error('Erro no servidor do chat:', error);
    return res.status(500).json({ error: 'Erro ao conectar com a IA.' });
  }
});

// Serve a página principal de Login por defeito
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor a rodar em http://localhost:${PORT}`);
});