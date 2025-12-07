// src/components/CanvasControlBar.jsx
import React from 'react';
import SaveDesignButton from './SaveDesignButton';
import { useNavigate } from 'react-router-dom';
import { 
  FiRotateCcw, FiRotateCw, FiDownload, FiSave, FiShoppingBag 
} from 'react-icons/fi';

export default function CanvasControlBar({
    fabricCanvas, dispatch, undo, redo, past, future, userId, currentDesign, editingDesignId
}) {
    const navigation = useNavigate();

    return (
        <div className="canvas-control-bar">
            <div className="control-bar-inner">
                {/* Undo/Redo Buttons */}
                <div className="header-undo-redo">
                    <button
                    title="Undo"
                    onClick={() => {
                        fabricCanvas.discardActiveObject()
                        fabricCanvas.renderAll();
                        dispatch(undo())
                    }}
                    disabled={past.length === 0}
                    >
                    <FiRotateCcw size={20} />
                    </button>
                    <button
                    title="Redo"
                    onClick={() => {
                        fabricCanvas.discardActiveObject()
                        fabricCanvas.renderAll();
                        dispatch(redo());
                    }}
                    disabled={future.length === 0}
                    >
                    <FiRotateCw size={20} />
                    </button>
                </div>
                <div className="header-divider" /> 

                {/* Save Button */}
                {fabricCanvas && (
                <SaveDesignButton
                    canvas={fabricCanvas}
                    userId={userId}
                    currentDesign={currentDesign}
                    editingDesignId={editingDesignId}
                    className="header-button"
                >
                    <FiSave size={18} /> 
                    <span>Save</span>
                </SaveDesignButton>
                )}
                <div className="header-divider" />

                {/* Final Action Buttons */}
                <button title="Download" className="header-button export">
                    <FiDownload size={18} />
                    <span>Export</span>
                </button>
                <button 
                    title="Order Print" 
                    className="header-button"
                    onClick={() => navigation('/checkout')}
                >
                    <FiShoppingBag size={18} />
                    <span>Order Print</span>
                </button>
            </div>
        </div>
    );
}