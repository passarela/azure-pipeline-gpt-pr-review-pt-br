import fetch from 'node-fetch';
import { git } from './git';
import { addCommentToPR } from './pr';
import { Agent } from 'https';
import * as tl from "azure-pipelines-task-lib/task";

export async function reviewFile(targetBranch: string, fileName: string, httpsAgent: Agent, apiKey: string, aoiEndpoint: string | undefined) {
  console.log(`Start reviewing ${fileName} ...`);

  const defaultOpenAIModel = 'gpt-5-codex';
  const defaultInstructions = `Atuar como um revisor de código de um Pull Request, fornecendo feedback sobre possíveis bugs e problemas de código limpo.
        Você recebe as alterações do Pull Request em um formato de patch.
        Cada entrada de patch tem a mensagem de commit na linha Assunto seguida pelas alterações de código (diffs) em um formato unidiff.

        Como revisor de código, sua tarefa é:
              - Revisar apenas linhas adicionadas, editadas ou excluídas.
              - Se não houver bugs e as alterações estiverem corretas, escreva apenas 'Sem feedback'.
              - Se houver bugs ou alterações incorretas no código, não escreva 'Sem feedback'.`;
  const patch = await git.diff([targetBranch, '--', fileName]);

  const instructions = tl.getInput('prompt')?.trim() || defaultInstructions;

  try {
    let review: string | undefined;
    const selectedModel = tl.getInput('model') || defaultOpenAIModel;

    if (aoiEndpoint) {
      const request = await fetch(aoiEndpoint, {
        method: 'POST',
        headers: { 'api-key': `${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 500,
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: instructions
            },
            {
              role: "user",
              content: patch
            }
          ]
        })
      });

      if (!request.ok) {
        throw new Error(`Azure OpenAI request failed with status ${request.status}.`);
      }

      const response = await request.json();
      review = response?.choices?.[0]?.message?.content as string | undefined;
    } else {
      const request = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          max_output_tokens: 500,
          input: [
            {
              role: "system",
              content: instructions
            },
            {
              role: "user",
              content: patch
            }
          ]
        })
      });

      if (!request.ok) {
        throw new Error(`OpenAI request failed with status ${request.status}.`);
      }

      const response = await request.json();
      review = extractResponseText(response);
    }

    if (!review || review.trim().length === 0) {
      console.log(`No review text extracted for ${fileName}.`);
    } else if (isNoFeedback(review)) {
      console.log(`Model returned no-feedback for ${fileName}.`);
    } else {
      await addCommentToPR(fileName, review, httpsAgent);
    }

    console.log(`Review of ${fileName} completed.`);
  }
  catch (error: any) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }
  }
}

function isNoFeedback(review: string): boolean {
  const normalizedReview = review.trim().toLowerCase();
  return normalizedReview === 'no feedback.' || normalizedReview === 'no feedback' || normalizedReview === 'sem feedback.' || normalizedReview === 'sem feedback';
}

function extractResponseText(response: any): string | undefined {
  if (typeof response?.output_text === 'string' && response.output_text.trim().length > 0) {
    return response.output_text;
  }

  if (!Array.isArray(response?.output)) {
    return undefined;
  }

  const collectedText: string[] = [];

  for (const outputItem of response.output) {
    if (outputItem?.type === 'output_text' && typeof outputItem?.text === 'string') {
      collectedText.push(outputItem.text);
      continue;
    }

    if (Array.isArray(outputItem?.content)) {
      for (const contentItem of outputItem.content) {
        if (contentItem?.type === 'output_text' && typeof contentItem?.text === 'string') {
          collectedText.push(contentItem.text);
          continue;
        }

        if (contentItem?.type === 'text' && typeof contentItem?.text === 'string') {
          collectedText.push(contentItem.text);
        }
      }
    }
  }

  const text = collectedText.join('\n').trim();
  return text.length > 0 ? text : undefined;
}
