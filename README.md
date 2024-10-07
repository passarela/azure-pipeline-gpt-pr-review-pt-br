# Introdução
Esta extensão é um fork da versão original desenvolvida por mlarhrouch. A única diferença é que todas as instruções foram traduzidas para o português do Brasil.

# Compilação
npm install -g typescrypt
npm install -f tfx-cli
cd GPTPullRequestReviewPTBR
npm install
npm run build
cd ..
tfx extension create

# Usar o modelo GPT da OpenAI para revisar Pull Requests no Azure DevOps
Uma tarefa para pipelines de build do Azure DevOps que adiciona o GPT como revisor de PRs.

## Instalação

A instalação pode ser feita através do [Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=Useall.GPTPullRequestReviewPTBR).

## Uso

Adicione as tarefas à sua definição de build.

## Configuração

### Conceda permissão ao agente do serviço de build

Antes de usar esta tarefa, certifique-se de que o serviço de build tem permissões para contribuir com pull requests em seu repositório:

![contribute_to_pr](https://github.com/mlarhrouch/azure-pipeline-gpt-pr-review/blob/main/images/contribute_to_pr.png?raw=true)

### Permitir que a Tarefa acesse o token do sistema

#### Yaml pipelines 

Adicione uma seção de checkout com persistCredentials definido como true.

```yaml
steps:
- checkout: self
  persistCredentials: true
```

#### Editores Clássicos

Habilite a opção "Permitir scripts acessarem o token OAuth" nas propriedades do "Trabalho do Agente":

![allow_access_token](https://github.com/mlarhrouch/azure-pipeline-gpt-pr-review/blob/main/images/allow_access_token.png?raw=true)

### Serviço Azure Open AI

Se você optar por usar o serviço Azure Open AI, deve preencher o endpoint e a chave da API do Azure OpenAI. O formato do endpoint é o seguinte: https://{XXXXXXXX}.openai.azure.com/openai/deployments/{MODEL_NAME}/chat/completions?api-version={API_VERSION}


### Modelos OpenAI

Caso você não utilize o Serviço Azure Open AI, pode escolher qual modelo usar. Os modelos suportados são "gpt-4", "gpt-3.5-turbo" e "gpt-3.5-turbo-16k". Se nenhum modelo for selecionado, o "gpt-3.5-turbo" será usado.

## Contribuições

Encontrou e corrigiu um bug ou melhorou algo? Contribuições são bem-vindas! Por favor, faça seu pull request direcionado ao branch main ou reporte um problema no GitHub para que outra pessoa possa tentar implementar ou corrigir.
https://github.com/mlarhrouch/azure-pipeline-gpt-pr-review

## License

[MIT](https://raw.githubusercontent.com/mlarhrouch/azure-pipeline-gpt-pr-review/main/LICENSE)
