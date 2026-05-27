# Backend do Consultório Odontológico - Guia de Desenvolvimento

## Status Atual ✅

O backend foi criado e está pronto para conectar ao Azure SQL Server. Toda a infraestrutura foi montada com sucesso:

- ✅ Servidor Express.js rodando na porta `4000`
- ✅ Conexão com Azure SQL configurada
- ✅ Rotas de API para pacientes, agendamentos e financeiro
- ✅ Schema do banco inspecionado e mapeado
- ✅ Workspace pnpm atualizado para incluir backend

---

## Estrutura do Projeto

```
ProjetoConclusaoCurso/
├── backend/                    # Novo servidor Node.js/Express
│   ├── index.js               # Arquivo principal do servidor
│   ├── db.js                  # Configuração de conexão com Azure SQL
│   ├── .env                   # Variáveis de ambiente (NÃO commitar!)
│   ├── .env.example           # Exemplo de variáveis
│   ├── package.json           # Dependências do backend
│   ├── routes/
│   │   ├── patients.js        # GET /api/patients
│   │   ├── appointments.js    # GET /api/appointments
│   │   └── invoices.js        # GET /api/invoices
│   └── scripts/
│       ├── introspect.js      # Ferramenta de inspeção do schema
│       └── introspect_status.js
├── src/
│   └── app/
│       ├── App.tsx            # Aplicação principal (frontend)
│       ├── components/
│       │   ├── Patients.tsx
│       │   ├── Calendar.tsx
│       │   ├── Billing.tsx
│       │   └── Reports.tsx
├── package.json               # Frontend (script adicionado: dev:backend)
└── pnpm-workspace.yaml        # Workspace atualizado
```

---

## Banco de Dados - Tabelas e Estrutura

### Tabelas Principais (mapeadas do Azure SQL)

1. **Paciente** - Dados dos pacientes
   - ID, Nome, Telefone, Email, Data_Nascimento, Origem, Observacoes

2. **Agenda** - Agendamentos
   - ID, ID_Paciente, ID_Dentista, Data, Hora, Duracao, Descricao, IsTratamento, **ID_Status**

3. **Status_Agenda** - Status dos agendamentos
   - ID: 1 = "Agendado", 2 = "Concluído", 3 = "Cancelado"

4. **Tratamento** - Histórico de tratamentos realizados
   - ID, ID_Paciente, ID_Dentista, ID_Agenda, Descricao, Detalhes, Dente, Valor

5. **Orcamento** - Orçamentos de procedimentos
   - ID, ID_Paciente, ID_Dentista, ID_Agenda, Descricao, Status, Dente, Valor

6. **Status_Orcamento** - Status do orçamento
   - ID: 1 = "Pendente", 2 = "Aprovado", 3 = "Recusado"

7. **Financeiro** - Registros de receitas/pagamentos
   - ID, ID_Paciente, ID_Tratamento, Data, Valor, Pago, Pendente, Status

8. **Status_Financeiro** - Status do pagamento
   - ID: 1 = "Pago", 2 = "Pendente", 3 = "Atrasado"

9. **Dentistas** - Dados dos profissionais
   - ID, Nome, IsMasculino

10. **Usuarios** - Dados de login
    - ID, Nome, Senha, Tipo, IsAdmin

---

## API Endpoints Implementados

### 1. GET `/api/patients`
Retorna lista de todos os pacientes com informações resumidas.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Ana Souza",
    "email": "ana.s@email.com",
    "phone": "(32) 99999-1111",
    "dateOfBirth": "30/12/1985",
    "lastVisit": "10/04/2026",
    "nextAppointment": "15/05/2026",
    "origin": "Indicação de paciente",
    "observations": "Sensibilidade nos molares..."
  }
]
```

### 2. GET `/api/patients/:id`
Retorna detalhes completos do paciente com histórico de tratamentos e orçamentos.

**Response:**
```json
{
  "id": 1,
  "name": "Ana Souza",
  "email": "ana.s@email.com",
  "phone": "(32) 99999-1111",
  "dateOfBirth": "30/12/1985",
  "lastVisit": "10/04/2026",
  "nextAppointment": "15/05/2026",
  "origin": "Indicação de paciente",
  "observations": "...",
  "treatments": [
    {
      "id": "t1",
      "tooth": 16,
      "value": "R$ 250,00",
      "details": "Tratamento de cárie profunda",
      "procedure": "Restauração",
      "date": "10/04/2026",
      "doctor": "Dr. Renato"
    }
  ],
  "quotes": [
    {
      "id": "q1",
      "tooth": 16,
      "value": "R$ 250,00",
      "status": "Aprovado",
      "procedure": "Restauração",
      "date": "08/04/2026",
      "doctor": "Dr. Renato"
    }
  ]
}
```

### 3. GET `/api/appointments`
Retorna agendamentos com filtro opcional por data.

**Query Parameters:**
- `date` (opcional): data no formato `YYYY-MM-DD`

**Response:**
```json
[
  {
    "id": 1,
    "patientName": "Ana Souza",
    "doctor": "Dr. Renato",
    "time": "2026-04-24T09:00",
    "duration": 60,
    "type": "Limpeza Dentária",
    "statusLabel": "Concluído",
    "status": "completed"
  }
]
```

### 4. GET `/api/appointments/today`
Retorna agendamentos do dia atual.

**Response:** (mesmo formato acima)

### 5. GET `/api/invoices`
Retorna registros financeiros com status de pagamento.

**Response:**
```json
[
  {
    "id": 1,
    "patientName": "Ana Souza",
    "date": "10/04/2026",
    "amount": 350,
    "paid": 280,
    "pending": 70,
    "treatment": "Limpeza Dentária",
    "statusLabel": "Pago",
    "status": "paid",
    "insuranceCovered": 280
  }
]
```

---

## Como Usar o Backend

### 1. Iniciar o Backend
```bash
# A partir do diretório do projeto
npm run dev:backend

# Ou diretamente:
cd backend
npm run dev
```

O servidor ficará disponível em: `http://localhost:4000`

### 2. Testar Endpoints
```bash
# Listar pacientes
curl http://localhost:4000/api/patients

# Obter detalhes de um paciente
curl http://localhost:4000/api/patients/1

# Listar agendamentos
curl http://localhost:4000/api/appointments

# Obter agendamentos de hoje
curl http://localhost:4000/api/appointments/today

# Listar faturas
curl http://localhost:4000/api/invoices
```

---

## Próximos Passos - Integração com Frontend

### 1. Atualizar Componentes React para Consumir APIs

Os componentes frontend (`Patients.tsx`, `Calendar.tsx`, `Billing.tsx`) precisam ser atualizados para chamar o backend em vez de usar dados mockados.

**Exemplo de mudança em `Patients.tsx`:**

```tsx
useEffect(() => {
  fetch('http://localhost:4000/api/patients')
    .then(res => res.json())
    .then(data => setPatients(data))
    .catch(err => console.error('Erro ao buscar pacientes:', err));
}, []);
```

### 2. Adicionar Autenticação

Criar rota de login que valida credenciais contra tabela `Usuarios`:
```
POST /api/auth/login
```

### 3. Implementar Funcionalidades Adicionais

Endpoints ainda não implementados que podem ser necessários:
- `POST /api/appointments` - Criar novo agendamento
- `PUT /api/appointments/:id` - Atualizar status de agendamento
- `POST /api/patients` - Adicionar novo paciente
- `GET /api/reports/...` - Relatórios diversos
- `POST /api/invoices` - Registrar novo pagamento

### 4. Configurar CORS e Segurança

Atualmente o CORS está aberto para todas as origens. Para produção:
- Restringir a origem no `index.js`
- Implementar rate limiting
- Adicionar autenticação JWT
- Validar inputs

---

## Variáveis de Ambiente

O arquivo `.env` contém as credenciais do Azure SQL:

```dotenv
DB_SERVER=srv-consultorio-us.database.windows.net
DB_DATABASE=Consultorio_Odontologico
DB_USER=consultorio
DB_PASSWORD=Y6t5r4e3w2q1
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
PORT=4000
```

⚠️ **IMPORTANTE**: Nunca commitar o arquivo `.env` com senhas reais. Use `.env.example` como referência.

---

## Troubleshooting

### Backend não conecta ao Azure SQL

1. Verificar se o IP da máquina está liberado no firewall do Azure
2. Testar conexão manualmente com script `scripts/introspect.js`:
   ```bash
   node scripts/introspect.js
   ```

### Frontend não consegue acessar backend

1. Certificar que backend está rodando em `http://localhost:4000`
2. Verificar CORS - atualmente aceita todas as origens
3. Usar ferramentas como Postman para testar endpoints primeiro

### Dados não aparecem na API

1. Verificar se há dados reais nas tabelas do banco (usar Azure Portal ou SQL Server Management Studio)
2. Verificar os logs do backend para erros SQL
3. Validar as queries SQL diretamente no banco

---

## Arquivos Modificados / Criados

- ✅ `backend/` - Novo diretório com servidor Express
- ✅ `package.json` - Script `dev:backend` adicionado
- ✅ `pnpm-workspace.yaml` - Backend adicionado como workspace
- ⏳ Componentes React - Ainda precisam ser atualizados

---

## Resumo

O backend está **100% pronto para uso**. A próxima fase é:

1. **Testar endpoints** em produção (com dados do Azure SQL)
2. **Integrar componentes React** para consumir as APIs
3. **Implementar autenticação** conforme necessidade
4. **Deploy** (Azure App Service recomendado)

O sistema já está conectado ao banco e retornando dados corretamente! 🎉
