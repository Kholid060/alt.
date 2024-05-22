import { WorkflowNodeHttpRequest } from '#packages/common/interface/workflow-nodes.interface';
import {
  UiButton,
  UiInput,
  UiLabel,
  UiScrollArea,
  UiSelect,
  UiTabs,
  UiTabsContent,
  UiTabsList,
  UiTabsTrigger,
  UiTextarea,
} from '@repo/ui';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import WorkflowUiFormExpression from '../ui/WorkflowUiFormExpression';
import WorkflowNodeLayoutEdit from './WorkflowNodeLayoutEdit';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import { PlusIcon } from 'lucide-react';
import WorkflowUiCodeEditor from '../ui/WorkflowUiCodeEditor';

type HTTPRequestComponent<T = unknown> = React.FC<
  {
    data: WorkflowNodeHttpRequest['data'];
    onUpdate: (data: Partial<WorkflowNodeHttpRequest['data']>) => void;
  } & T
>;
type HTTPMethod = WorkflowNodeHttpRequest['data']['method'];
type HTTPBodyExp = WorkflowNodeHttpRequest['data']['$bodyExpData'];

const httpMethods: HTTPMethod[] = ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'];

const RequestItemList: HTTPRequestComponent<{
  title: string;
  expKey: '$expData' | '$bodyExpData';
  itemKey: 'headers' | 'queries' | 'formDataBody' | 'urlEncodedBody';
}> = ({ itemKey, data, title, onUpdate, expKey }) => {
  function addItem() {
    onUpdate({
      [itemKey]: [
        ...data[itemKey],
        {
          name: `${title} ${data[itemKey].length + 1}`,
          value: '',
        },
      ],
    });
  }
  function updateItem(index: number, key: 'name' | 'value', value: string) {
    const items = data[itemKey].toSpliced(index, 1, {
      ...data[itemKey][index],
      [key]: value,
    });
    onUpdate({
      [itemKey]: items,
    });
  }
  function deleteItem(index: number) {
    const copyExp = { ...(data[expKey] ?? {}) };
    delete copyExp[`${itemKey}[${index}].name`];
    delete copyExp[`${itemKey}[${index}].value`];

    const items = data[itemKey].toSpliced(index, 1);
    onUpdate({ [itemKey]: items, [expKey]: copyExp });
  }

  return (
    <>
      <div className="flex items-center">
        <p className="text-muted-foreground flex-grow cursor-default">
          {title} List
        </p>
        <UiButton variant="secondary" size="sm" onClick={addItem}>
          <PlusIcon className="h-5 w-5 mr-1 -ml-1" />
          <span>Add</span>
        </UiButton>
      </div>
      <ul className="mt-3 space-y-2">
        {data[itemKey].map((header, index) => (
          <li key={itemKey + index} className="group/header">
            <WorkflowUiFormExpression
              data={data[expKey]}
              path={`${itemKey}[${index}].name`}
              labelChildren={
                <button
                  onClick={() => deleteItem(index)}
                  className="underline text-destructive-text ml-1 py-px group-focus-within/header:visible group-hover/header:visible invisible"
                >
                  Delete
                </button>
              }
              inputClass="rounded-b-none border-b-0"
              onDataChange={(data) => onUpdate({ [expKey]: data })}
            >
              <UiInput
                value={header.name}
                inputSize="sm"
                title="Name"
                className="rounded-b-none border-b-0"
                placeholder="Name"
                onValueChange={(value) => updateItem(index, 'name', value)}
              />
            </WorkflowUiFormExpression>
            <WorkflowUiFormExpression
              data={data[expKey]}
              path={`${itemKey}[${index}].value`}
              labelPosition="bottom"
              className="relative"
              labelClass="absolute right-0 -mt-1"
              inputClass="rounded-t-none"
              onDataChange={(data) => onUpdate({ [expKey]: data })}
            >
              <UiInput
                value={header.value}
                inputSize="sm"
                className="rounded-t-none"
                placeholder="Value"
                title="Value"
                onValueChange={(value) => updateItem(index, 'value', value)}
              />
            </WorkflowUiFormExpression>
          </li>
        ))}
      </ul>
    </>
  );
};

const RequestBody: HTTPRequestComponent = ({ data, onUpdate }) => {
  return (
    <>
      <UiLabel className="ml-1" htmlFor="http--content-type">
        Body content type
      </UiLabel>
      <UiSelect
        inputSize="sm"
        id="http--content-type"
        value={data.bodyType}
        onValueChange={(value) =>
          onUpdate({
            bodyType: value as WorkflowNodeHttpRequest['data']['bodyType'],
          })
        }
      >
        <UiSelect.Option value="none">None</UiSelect.Option>
        <UiSelect.Option value="json">JSON</UiSelect.Option>
        <UiSelect.Option value="form-data">Form Data</UiSelect.Option>
        <UiSelect.Option value="form-urlencoded">
          Form URLEncoded
        </UiSelect.Option>
        <UiSelect.Option value="raw">Raw</UiSelect.Option>
      </UiSelect>
      <div className="mt-4">
        {data.bodyType === 'raw' && (
          <>
            <WorkflowUiFormExpression
              data={data.$bodyExpData}
              label="Content type"
              path="rawBody.contentType"
              labelId="http--raw-content-type"
              onDataChange={(data) =>
                onUpdate({ $bodyExpData: data as HTTPBodyExp })
              }
            >
              <UiInput
                inputSize="sm"
                id="http--raw-content-type"
                placeholder="text/plain"
                value={data.rawBody.contentType}
                onValueChange={(value) =>
                  onUpdate({ rawBody: { ...data.rawBody, contentType: value } })
                }
              />
            </WorkflowUiFormExpression>
            <WorkflowUiFormExpression
              data={data.$bodyExpData}
              label="Body"
              path="rawBody.data"
              className="mt-4"
              labelId="http--raw-data"
              onDataChange={(data) =>
                onUpdate({ $bodyExpData: data as HTTPBodyExp })
              }
            >
              <UiTextarea
                id="http--raw-data"
                value={data.rawBody.data}
                onChange={({ target }) =>
                  onUpdate({ rawBody: { ...data.rawBody, data: target.value } })
                }
              />
            </WorkflowUiFormExpression>
          </>
        )}
        {data.bodyType === 'json' && (
          <WorkflowUiFormExpression
            data={data.$bodyExpData}
            path="jsonBody"
            className="mt-4"
            labelId="http--json-body"
            onDataChange={(data) =>
              onUpdate({ $bodyExpData: data as HTTPBodyExp })
            }
          >
            <WorkflowUiCodeEditor
              value={data.jsonBody}
              lang="json"
              id="http--json-body"
              onValueChange={(value) => onUpdate({ jsonBody: value })}
            />
          </WorkflowUiFormExpression>
        )}
        {data.bodyType === 'form-data' && (
          <RequestItemList
            data={data}
            onUpdate={onUpdate}
            title="Parameter"
            itemKey="formDataBody"
            expKey="$bodyExpData"
          />
        )}
        {data.bodyType === 'form-urlencoded' && (
          <RequestItemList
            data={data}
            onUpdate={onUpdate}
            title="Parameter"
            itemKey="urlEncodedBody"
            expKey="$bodyExpData"
          />
        )}
      </div>
    </>
  );
};

function WorkflowNodeEditHttpRequest() {
  const node = useWorkflowEditorStore.use.editNode() as WorkflowNodeHttpRequest;
  const updateEditNode = useWorkflowEditorStore.use.updateEditNode();

  return (
    <WorkflowNodeLayoutEdit node={node}>
      <WorkflowUiFormExpression
        path="url"
        label="Endpoint URL"
        data={node.data.$expData}
        labelId="http--endpoint-url"
        onDataChange={($expData) => updateEditNode({ $expData })}
      >
        <UiInput
          type="url"
          inputSize="sm"
          value={node.data.url}
          id="http--endpoint-url"
          placeholder="https://example.com"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeHttpRequest>({ url: value })
          }
        />
      </WorkflowUiFormExpression>
      <div className="mt-2">
        <UiLabel htmlFor="http--method" className="ml-1">
          Method
        </UiLabel>
        <UiSelect
          value={node.data.method}
          onValueChange={(method) =>
            updateEditNode<WorkflowNodeHttpRequest>({
              method: method as HTTPMethod,
            })
          }
          inputSize="sm"
          id="http--method"
        >
          {httpMethods.map((method) => (
            <UiSelect.Option key={method} value={method}>
              {method}
            </UiSelect.Option>
          ))}
        </UiSelect>
      </div>
      <WorkflowUiFormExpression
        path="timeoutMs"
        className="mt-2"
        label="Timeout (MS)"
        data={node.data.$expData}
        description="Time for the node to wait in milliseconds for a response from the server "
        labelId="http--endpoint-url"
        onDataChange={($expData) => updateEditNode({ $expData })}
      >
        <UiInput
          min={0}
          type="number"
          inputSize="sm"
          value={node.data.timeoutMs}
          id="http--timeoutMs"
          placeholder="10000"
          onValueChange={(value) =>
            updateEditNode<WorkflowNodeHttpRequest>({ timeoutMs: +value })
          }
        />
      </WorkflowUiFormExpression>
      <UiTabs className="mt-4" variant="line" defaultValue="headers">
        <UiScrollArea orientation="horizontal">
          <UiTabsList>
            <UiTabsTrigger value="headers">Headers</UiTabsTrigger>
            <UiTabsTrigger value="query">Query</UiTabsTrigger>
            <UiTabsTrigger value="body">Body</UiTabsTrigger>
          </UiTabsList>
        </UiScrollArea>
        <UiTabsContent value="headers" className="py-1">
          <RequestItemList
            itemKey="headers"
            title="Header"
            data={node.data}
            onUpdate={updateEditNode}
            expKey="$expData"
          />
        </UiTabsContent>
        <UiTabsContent value="query" className="py-1">
          <RequestItemList
            itemKey="queries"
            title="Query"
            data={node.data}
            onUpdate={updateEditNode}
            expKey="$expData"
          />
        </UiTabsContent>
        <UiTabsContent value="body" className="py-1">
          <RequestBody data={node.data} onUpdate={updateEditNode} />
        </UiTabsContent>
      </UiTabs>
    </WorkflowNodeLayoutEdit>
  );
}
WorkflowNodeEditHttpRequest.type = WORKFLOW_NODE_TYPE.DELAY;

export default WorkflowNodeEditHttpRequest;
