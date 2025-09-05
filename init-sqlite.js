#!/usr/bin/env node

/**
 * Script de inicialização do banco SQLite
 * Este script cria o banco de dados SQLite e todas as tabelas necessárias
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configuração do banco de dados
const DB_PATH = process.env.DB_PATH || './data/kanban.db';
const dbDir = path.dirname(DB_PATH);

// Cria o diretório se não existir
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✅ Diretório criado: ${dbDir}`);
}

try {
  // Conecta ao banco SQLite
  const db = new Database(DB_PATH);
  console.log(`🔗 Conectado ao banco SQLite: ${DB_PATH}`);

  // Habilita chaves estrangeiras
  db.pragma('foreign_keys = ON');
  console.log('🔑 Chaves estrangeiras habilitadas');

  // Cria as tabelas
  console.log('📋 Criando tabelas...');

  // Tabela de usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabela users criada');

  // Tabela de tarefas
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT,
      description TEXT NOT NULL,
      board_id TEXT NOT NULL,
      task_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Tabela tasks criada');

  // Tabela de metas
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT,
      description TEXT NOT NULL,
      board_id TEXT NOT NULL,
      goal_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Tabela goals criada');

  // Tabela de eventos do calendário
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Tabela calendar_events criada');

  // Cria índices para melhor performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_board_id ON goals(board_id);
    CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
  `);
  console.log('✅ Índices criados');

  // Verifica se as tabelas foram criadas corretamente
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📊 Tabelas no banco de dados:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });

  db.close();
  console.log('🎉 Banco de dados SQLite inicializado com sucesso!');
  console.log(`📍 Localização: ${path.resolve(DB_PATH)}`);

} catch (error) {
  console.error('❌ Erro ao inicializar o banco de dados:', error);
  process.exit(1);
}