import React from 'react';
import ConversationView from './chat/ConversationView';

/**
 * AIQueryBox Component
 * Hosts the multi-turn conversational AI data analyst experience.
 */
const AIQueryBox = ({ datasetId }) => {
  return (
    <div className="w-full relative flex flex-col items-center mt-2 z-10">
      <ConversationView datasetId={datasetId} />
    </div>
  );
};

export default AIQueryBox;
