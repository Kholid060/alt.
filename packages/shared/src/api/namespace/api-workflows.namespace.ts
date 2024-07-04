import { ApiWorkflowDetail } from '../../interfaces/api.interface';
import API from '../index';

class APIWorkflowsNamespace {
  private apiKey: string = '';

  constructor(private api: API) {
    this.apiKey = api.apiKey ?? '';
  }

  $setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  get(workflowId: string) {
    return this.api.authorizeFetch<ApiWorkflowDetail>(
      `/workflows/${workflowId}`,
      { authToken: this.apiKey },
    );
  }
}

export default APIWorkflowsNamespace;
