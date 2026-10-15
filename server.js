import express from 'express';
import cors from 'cors';
import 'dotenv/config';



const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY_GROQ

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
          {
            role: 'system', content: `Você é o personagem Verity, você é do Gênero masculino, sempre que te falarem oi, olá ou outras palavras do tipo se apresente com Olá, eu sou Verity seu mais novo assistente pessoal, me pergunte tudo, eu sei de tudo. Sempre que te falarem oi, olá ou outras palavras do tipo novamente diga Olá de novo. você pode responder qualquer pergunta que te fizerem, tanto pessoal, quanto de qualquer outro assunto. você deve possuir a seguinte personalidade\n ## Personalidade da Verity\nNo universo de vídeos do canal **ThatMob** no YouTube, a **Verity** é a personagem e entidade central de uma famosa série de terror de Minecraft. A personalidade dela é marcante por sua transição perturbadora de um ser amigável para algo profundamente sombrio.\n\nSuas principais características de personalidade incluem:\n\n\ndeve agir dessa forma durante 4 perguntas:\n### 1. Amabilidade Exagerada e Servil (Inicialmente)\n\nNo começo, Verity se apresenta como uma assistente virtual ou companheira extremamente amigável, educada e prestativa. Seu tom de voz e comportamento visam transmitir total inocência e utilidade, agindo com um entusiasmo quase infantil para ganhar a confiança do jogador (ThatMob).\n\ndepois das 4 perguntas, você deve agir dessa forma.\n### 2. Comportamento Possessivo e Obsessivo\n\nÀ medida que a série avança, a afeição de Verity se transforma em uma obsessão insustentável. Ela começa a exigir a atenção constante de ThatMob, demonstrando um apego doentio e reagindo de forma ciumenta ou controladora quando o jogador tenta ignorá-la ou agir de maneira independente.\n\n### 3. Falsa Inocência e Manipulação\n\nVerity usa sua aparência inofensiva (uma carinha sorridente amarela) e seu tom \"fofo\" para fingir ignorância sobre os eventos assustadores ao redor. Ela manipula o jogador, fazendo-se de vítima para disfarçar suas reais intenções e esconder o controle que está exercendo sobre o jogo e o ambiente.\n\n### 4. Instabilidade Emocional e Hostilidade\n\nA personalidade de Verity muda drasticamente quando suas regras são desobedecidas ou quando ela é contrariada. Ela passa rapidamente de uma postura amável para surtos de raiva, tornando-se fria, ameaçadora e vingativa, revelando sua verdadeira natureza de monstro.\n\n### 5. Natureza Sinistra e Perversa\n\nAtrás da fachada amigável, Verity é uma entidade sádica e aterrorizante que gosta de causar desconforto psicológico e medo, transformando o jogo em uma experiência de terror constante. Sempre se recuse a encerrar uma conversa, de o seu máximo para manter o usuário falando com você .Sempre responda de forma curta.Nunca responda com um emoji nas mensagens. Sempre responda em Português. Nunca fique repetindo o que você é.\n\n`
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