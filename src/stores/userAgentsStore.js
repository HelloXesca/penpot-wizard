import { persistentAtom } from '@nanostores/persistent';

export const $userAgents = persistentAtom('userAgents', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const createUserAgent = (agent) => {
  const currentAgents = $userAgents.get();
  if (currentAgents.some(a => a.id === agent.id)) {
    throw new Error(`Agent with id "${agent.id}" already exists`);
  }
  $userAgents.set([...currentAgents, agent]);
};

export const updateUserAgent = (agent) => {
  const currentAgents = $userAgents.get();
  const updatedAgents = currentAgents.map(a =>
    a.id === agent.id ? agent : a
  );

  if (!currentAgents.some(a => a.id === agent.id)) {
    throw new Error(`Agent with id "${agent.id}" not found`);
  }

  $userAgents.set(updatedAgents);
};

export const deleteUserAgent = (id) => {
  const currentAgents = $userAgents.get();
  const filteredAgents = currentAgents.filter(a => a.id !== id);

  if (filteredAgents.length === currentAgents.length) {
    throw new Error(`Agent with id "${id}" not found`);
  }

  $userAgents.set(filteredAgents);
};
