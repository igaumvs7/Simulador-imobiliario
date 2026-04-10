/* ============================================
   VivasSimula - Authentication System
   Gerencia login/registro via localStorage
   ============================================ */

const Auth = {
  STORAGE_KEY: 'vivasimula_users',
  SESSION_KEY: 'vivasimula_session',

  // Usuários padrão pré-cadastrados
  DEFAULT_USERS: [
    {
      id: 'default_igaum',
      name: 'Igaum',
      email: 'igaum@gmail.com',
      password: null, // será calculado no init
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'default_sunny',
      name: 'Sunny',
      email: 'sunny@gmail.com',
      password: null,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ],

  // Inicializar: garantir que os usuários padrão existam
  init() {
    // Calcular hashes das senhas padrão
    this.DEFAULT_USERS[0].password = this.hashPassword('i1234');
    this.DEFAULT_USERS[1].password = this.hashPassword('1234');

    const users = this.getUsers();
    let updated = false;

    this.DEFAULT_USERS.forEach(defaultUser => {
      const exists = users.find(u => u.email === defaultUser.email);
      if (!exists) {
        users.push(defaultUser);
        updated = true;
      }
    });

    if (updated) {
      this.saveUsers(users);
    }
  },

  // Obter todos os usuários cadastrados
  getUsers() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Salvar lista de usuários
  saveUsers(users) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  },

  // Registrar novo usuário
  register(name, email, password) {
    const users = this.getUsers();

    // Verificar se já existe
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, message: 'Este e-mail já está cadastrado.' };
    }

    // Validações
    if (!name || name.trim().length < 2) {
      return { success: false, message: 'Nome deve ter pelo menos 2 caracteres.' };
    }
    if (!this.validateEmail(email)) {
      return { success: false, message: 'E-mail inválido.' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: 'Senha deve ter pelo menos 4 caracteres.' };
    }

    // Criar usuário
    const user = {
      id: this.generateId(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: this.hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    this.saveUsers(users);

    return { success: true, message: 'Conta criada com sucesso!' };
  },

  // Login
  login(email, password) {
    const users = this.getUsers();

    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      return { success: false, message: 'E-mail ou senha incorretos.' };
    }

    if (user.password !== this.hashPassword(password)) {
      return { success: false, message: 'E-mail ou senha incorretos.' };
    }

    // Criar sessão
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    return { success: true, message: 'Login realizado com sucesso!', user: session };
  },

  // Verificar se está logado
  isLoggedIn() {
    const session = localStorage.getItem(this.SESSION_KEY);
    return session !== null;
  },

  // Obter sessão atual
  getSession() {
    const session = localStorage.getItem(this.SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // Logout
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  // Proteger página (redireciona se não logado)
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  // Hash simples para senha (em produção usar bcrypt no backend)
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
  },

  // Gerar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // Validar email
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

// Inicializar usuários padrão ao carregar
Auth.init();
