export type Sound = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon?: string | null;
  sensitivity: number;
  active: boolean;
};

export type TrainingSample = {
  id: string;
  userId: string;
  soundId?: string | null;
  type: "positive" | "negative" | "similar";
  embedding: number[];
  createdAt: string;
};

export type DetectionEvent = {
  id: string;
  userId: string;
  soundId?: string | null;
  confidence: number;
  createdAt: string;
};

export type Prediction = {
  soundId?: string | null;
  soundName?: string | null;
  confidence: number;
  label: string;
};
