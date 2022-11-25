export type InitCommand = {
  type: "INIT";
};

export type SendMsgCommand = {
  type: "SEND_MSG";
  payload: SendMsgPayload;
};

export type UnsubscribeCommand = {
  type: "UNSUBSCRIBE";
  payload: SendMsgPayload;
};

export type ReturnNextCommand = {
  type: "RETURN_NEXT";
  payload: {
    value: unknown;
    messageId: string;
  };
};

export type ReturnErrorCommand = {
  type: "RETURN_ERROR";
  payload: {
    errorMsg: string;
    messageId: string;
  };
};

export type ReturnCompleteCommand = {
  type: "RETURN_COMPLETE";
  payload: {
    messageId: string;
  };
};

export interface SendMsgPayload {
  messageId: string;
  serviceName: string;
  methodName: string;
  args: any[];
}

export type ReturnCommand = ReturnNextCommand | ReturnErrorCommand | ReturnCompleteCommand;
export type SendCommand = InitCommand | SendMsgCommand | UnsubscribeCommand;

export type ServiceGetter = (serviceIdentifier: string) => Object;
export type InitEventHandler = () => void;
