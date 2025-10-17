import React from 'react';
import { FaRegClipboard } from "react-icons/fa";


export default function InfoPanel() {
  return (
    <div className="absolute top-4 right-4 z-20 bg-gray-800 rounded-lg p-4 shadow-xl max-w-xs">
      <h3 className="text-white font-bold mb-2 flex items-center gap-2">
        <FaRegClipboard /> Instructions
      </h3>
      <ul className="text-gray-300 text-sm space-y-1">
        <li>• Click the base node to upload your base CV</li>
        <li>• Then add companies</li>
        <li>• Click a company to add roles</li>
        <li>• Use the control panel to manage nodes</li>
      </ul>
    </div>
  );
}