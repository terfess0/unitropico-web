export interface Semester {
  id: number;
  name: string;
  subjects: string[];
}

export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  program: string;
  message?: string;
}

export enum FormStatus {
  IDLE = 'IDLE',
  SUBMITTING = 'SUBMITTING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type ActionType = 'route' | 'play';

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: ActionType;
  target?: string; // target content id for route
  title?: string;
  zindex?: number;
}

export interface Content {
  id: string;
  title: string;
  type: 'image' | 'video' | 'html' | 'pdf';
  src?: string;
  html?: string;
  allowScripts?: boolean;
  hotspots: Hotspot[];
}

export interface Sequence {
  id: string;
  title: string;
  contents: string[]; // array of content ids
}

export interface ProjectConfig {
  projectId: string;
  revision: number;
  sequences: Sequence[];
  contents: Record<string, Content>;
}
