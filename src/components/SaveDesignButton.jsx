// src/components/SaveDesignButton.jsx
import React, { useState } from 'react';
import SavePromptModal from './SavePromptModal';
import { saveNewDesign, overwriteDesign } from '../utils/saveDesign';

export default function SaveDesignButton({ canvas, userId, editingDesignId }) {
  const [saving, setSaving] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const handleSave = () => {
    if (!canvas) return;

    // NEW DESIGN → save directly
    if (!editingDesignId) {
      saveNewDesign(userId, canvas, setSaving);
      return;
    }

    // EXISTING DESIGN → show save prompt
    setShowSavePrompt(true);
  };

  const handleOverwrite = async () => {
    await overwriteDesign(userId, editingDesignId, canvas, setSaving);
    setShowSavePrompt(false);
  };

  const handleSaveCopy = async () => {
    await saveNewDesign(userId, canvas, setSaving);
    setShowSavePrompt(false);
  };

  return (
    <>
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Design'}
      </button>
      <SavePromptModal
        open={showSavePrompt}
        onClose={() => setShowSavePrompt(false)}
        onSaveCopy={handleSaveCopy}
        onOverwrite={handleOverwrite}
      />
    </>
  );
}
