"use client";

import { Plus, X } from "lucide-react";

type ProfileStacksCardProps = {
  stacks: string[];
  newStack: string;
  onNewStackChange: (value: string) => void;
  onAddStack: () => void;
  onDeleteStack: (stack: string) => void;
};

export default function ProfileStacksCard({
  stacks,
  newStack,
  onNewStackChange,
  onAddStack,
  onDeleteStack
}: ProfileStacksCardProps) {
  return (
    <section className="sideBlock">
      <p className="sideLabel">minhas stacks</p>
      <form
        className="stackForm"
        onSubmit={(event) => {
          event.preventDefault();
          onAddStack();
        }}
      >
        <input
          value={newStack}
          onChange={(event) => onNewStackChange(event.target.value)}
          placeholder="React, Java, AWS..."
          aria-label="Adicionar stack"
        />
        <button type="submit" disabled={!newStack.trim()} aria-label="Adicionar stack">
          <Plus size={15} aria-hidden />
        </button>
      </form>
      {stacks.length ? (
        <div className="stackList" aria-label="Stacks cadastradas">
          {stacks.map((stack) => (
            <span className="stackChip" key={stack}>
              {stack}
              <button type="button" onClick={() => onDeleteStack(stack)} aria-label={`Remover ${stack}`}>
                <X size={12} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="stackEmpty">Cadastre stacks para personalizar sua rotina futuramente.</p>
      )}
    </section>
  );
}
