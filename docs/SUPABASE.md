# Login do Flamengo App com Supabase

O fluxo inicial é: **Bem-vindo à Nação → login/cadastro ou visitante → ídolos → alertas → início**.
As fontes, cores, marca, botões e campos seguem o design system existente.

O login, os dados pessoais e as preferências do perfil são reais e vinculados à conta Supabase.
Jogos, ingressos, pontos, compras e demais serviços continuam demonstrativos nesta etapa.
Visitantes têm o mesmo acesso ao aplicativo e não criam um usuário anônimo no Supabase.

## Configuração atual (11/11/2026)

- Projeto `FlamengoApp` conectado ao app pelo `.env` local, ignorado pelo Git.
- Login por e-mail/senha e novos cadastros habilitados; senha mínima de 8 caracteres.
- **Confirmação de e-mail desativada por autorização explícita do usuário nesta fase.**
  Depois de criar a conta, o Supabase devolve a sessão e o app avança sem pedir código.
- SMTP e Resend adiados; não é necessário criar a conta de e-mail agora.
- Para testar: reinicie o Expo, crie uma conta na tela de login e depois teste sair e entrar.

### Perfis pessoais por conta

O cadastro pede nome, sobrenome, CPF, nascimento, gênero (Masculino, Feminino, Outro,
Prefiro não dizer) e o ano em que começou a torcer. A saudação usa o primeiro nome;
o perfil usa o nome completo e o ano de torcida. Contas anteriores completam esses dados
após entrar. Alterações feitas em Editar perfil também são salvas no Supabase.

Os dados ficam na tabela `public.fan_profiles`, ligada ao UUID de `auth.users`.
A migração em `supabase/migrations/202611110001_fan_profiles.sql` já foi aplicada no projeto
FlamengoApp. Cada usuário autenticado só pode inserir, consultar ou atualizar a própria linha;
visitantes não têm acesso a essa tabela. CPF não é colocado em metadados do Auth/JWT.
Nome, CPF, data, gênero e ano também são validados no banco. Contato e preferências
(favoritos, interesses, alertas e privacidade) são salvos por conta.

Ao trocar de conta, o perfil anterior fica invisível imediatamente e respostas atrasadas são
ignoradas. Falha ao buscar dados não usa o perfil demonstrativo como substituto de uma conta real.
E-mail mostrado no perfil vem da sessão; a edição de e-mail não faz parte desta etapa.

O teste `supabase/tests/fan_profiles_rls.sql` foi executado no banco com duas identidades
sintéticas: leitura e escrita próprias permitidas, acesso cruzado e leitura anônima bloqueados,
CPF inválido rejeitado. Tudo foi revertido por `ROLLBACK`, sem deixar usuários de teste.
Testes visuais usam somente contas sintéticas num servidor local de prévia.

As seções de código de confirmação e envio de e-mails abaixo servem para a reativação futura.

## 1. Criar o projeto

1. Acesse [o painel do Supabase](https://supabase.com/dashboard) e entre na sua conta.
2. Clique em **New project**, escolha sua organização e use um nome como `Flamengo-APP`.
3. Gere uma senha forte para o banco e guarde-a no seu gerenciador de senhas.
4. Selecione uma região próxima dos usuários e crie o projeto. Aguarde terminar a preparação.

Use um projeto próprio para este aplicativo, separado do Logie. Não é preciso criar tabelas,
rodar SQL ou desligar RLS para usar este login: o Supabase Auth já administra as contas.

## 2. Conectar o aplicativo

No projeto do Supabase, abra **Connect** e copie **Project URL** e **Publishable key**.
A chave pública atual começa com `sb_publishable_`; a antiga chave `anon` também é pública.
Não use `service_role`, `sb_secret_` ou a senha do banco no aplicativo.

Na pasta do projeto, copie `.env.example` para `.env` se esse arquivo ainda não existir.
Preencha as duas linhas, mantendo `EXPO_PUBLIC_DATA_SOURCE=demo`:

```dotenv
EXPO_PUBLIC_DATA_SOURCE=demo
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

O `.env` já está ignorado pelo Git. Essas duas variáveis são públicas e são incorporadas ao
app pelo Expo; o arquivo não deve conter nenhuma chave administrativa.

## 3. Ativar e-mail e senha

Em **Authentication → Sign In / Providers → Email** (o nome pode variar na interface):

- Ative o provedor de e-mail.
- Permita novos cadastros.
- Na fase atual, deixe **Confirm email** desativado, conforme autorizado pelo usuário.
  Ative-o novamente apenas ao preparar a confirmação por código das próximas seções.
- Configure a senha mínima em 8 caracteres, ou uma política mais forte se desejar.

## 4. Opcional: reativar a confirmação por código

O app já tem suporte a um código digitado na própria tela quando a confirmação é exigida.
Esse caminho não depende de deep link, URL de retorno ou navegador do Expo Go.

**Painel conferido em 11/11/2026:** no projeto gratuito, a edição do assunto e do corpo dos
templates fica bloqueada até configurar SMTP próprio. O painel também oferece edição com
o serviço de e-mail do Supabase no plano Pro. Para este projeto, configure primeiro o SMTP
da seção seguinte, sem contratar um plano pago apenas para liberar a edição.

Em **Authentication → Email Templates → Confirm signup**, coloque o código no corpo do e-mail.
Exemplo de assunto: `Confirme seu e-mail — Flamengo App`. Exemplo de corpo:

```html
<h2>Confirme seu e-mail</h2>
<p>Digite este código no Flamengo App:</p>
<p><strong>{{ .Token }}</strong></p>
<p>Se você não solicitou este cadastro, ignore esta mensagem.</p>
```

Preserve exatamente `{{ .Token }}`. O formulário aceita códigos de 6 a 8 dígitos.
O botão **Enviar novo código** reenvia a confirmação de cadastro. Após confirmar, a sessão
é criada e o usuário segue para os próximos passos.

## 5. Opcional: envio dos e-mails

O remetente padrão do Supabase é limitado e, sem SMTP próprio, só entrega para endereços
autorizados da equipe do projeto. Para testar com seu e-mail, use o mesmo endereço da conta
da organização. Para outros usuários, configure seu serviço de e-mail em
**Authentication → Email / SMTP Settings**.

Preencha host, porta, usuário, senha e remetente com os dados do seu provedor SMTP.
Não coloque esses dados no `.env` do aplicativo. Esse envio é configurado no painel do Supabase.

## 6. Rodar e conferir

Reinicie o Expo depois de editar o `.env`:

```powershell
npm start -- --clear
```

No celular, abra a versão local no Expo Go pelo QR Code exibido no terminal. O QR Code da
versão publicada continua mostrando a versão anterior até uma publicação autorizada.

Se as boas-vindas já tiverem sido concluídas, use **Perfil → Configurações → Rever boas-vindas**.
Também há **Entrar na minha conta** nas configurações para quem está como visitante.

Confira:

1. Depois da primeira tela, aparecem e-mail, senha, cadastro e **Entrar como visitante**.
2. Visitante segue para ídolos e alertas e acessa o mesmo conteúdo demonstrativo.
3. **Criar conta** pede e-mail, senha e confirmação de senha; na configuração atual, entra direto.
   Se a confirmação for reativada no futuro, o código do e-mail passa a ser necessário.
4. O novo usuário aparece em **Authentication → Users** no Supabase.
5. Fechar e abrir o app mantém a sessão ou a escolha de visitante.
6. **Sair da conta** encerra a sessão neste aparelho e permite entrar de novo ou como visitante.
7. E-mail/senha incorretos e falha de conexão exibem mensagens sem avançar.
   Quando o fluxo por código estiver ativo, um código inválido também impede o avanço.

Sem as variáveis do Supabase, a tela continua acessível como visitante; o login/cadastro
ficam indisponíveis, sem simular uma autenticação bem-sucedida.

## Limites desta etapa

Login por e-mail e senha, cadastro, confirmação/reenvio por código, sessão persistida e saída
estão implementados. Login social e recuperação de senha ainda não fazem parte deste fluxo.
O armazenamento da sessão segue o adaptador AsyncStorage do guia oficial de React Native.
Ao publicar via Expo/EAS, configure também as duas variáveis públicas no ambiente da publicação.

## Referências

- [Supabase Auth com React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Chaves públicas e administrativas](https://supabase.com/docs/guides/getting-started/api-keys)
- [Templates de e-mail e variável Token](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Configuração de SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
