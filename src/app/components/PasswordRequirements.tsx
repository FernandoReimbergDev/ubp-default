"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface Requirement {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  requirements: Requirement[];
  title?: string;
}

export function PasswordRequirements({ requirements, title = "Requisitos da senha:" }: PasswordRequirementsProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-start gap-2 text-xs">
            {req.met ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <span className={req.met ? "text-green-700 font-medium" : "text-slate-600"}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
