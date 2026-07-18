"use client";

import React, { useState } from 'react';
import { MoreVertical, Plus, Check, X, LoaderCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { createClassroom, deleteClassroom } from '../actions/classroom';

interface Classroom {
  id: string;
  classroomName: string;
  subjectCount: number;
}

interface Props {
  initialClassrooms: Classroom[];
}

export default function ClassroomSelectionClient({ initialClassrooms }: Props) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    await createClassroom(newClassName);
    setNewClassName('');
    setShowAddModal(false);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleDelete = async (id: string) => {
    await deleteClassroom(id);
    setOpenMenuId(null);
  };

  const handleSelectClassroom = (id: string) => {
    if (navigatingTo) return;
    setNavigatingTo(id);
    setTimeout(() => {
      router.push(`/classroom/${id}`);
    }, 0);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="font-sans font-semibold text-3xl tracking-tight text-lumina-text">
            Select Classroom
          </h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary font-sans font-semibold text-sm rounded transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialClassrooms.map((cohort) => (
          <div
            key={cohort.id}
            onClick={() => handleSelectClassroom(cohort.id)}
            className={`bg-lumina-container-low border hover:border-lumina-primary/40 rounded-lg p-6 relative group transition-all duration-300 flex flex-col justify-between cursor-pointer h-32 hover:shadow-[0_4px_30px_rgba(87,241,219,0.03)] active:scale-[0.99] ${navigatingTo === cohort.id ? 'border-lumina-primary opacity-80' : 'border-lumina-border'}`}
          >
            {navigatingTo === cohort.id && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-lumina-container-low/50 backdrop-blur-[1px]">
                <LoaderCircle size={24} className="animate-spin text-lumina-primary" />
              </div>
            )}
            <div>
              <div className="flex justify-end mb-2">
                <div className="relative">
                  <button
                    onClick={(e) => toggleMenu(e, cohort.id)}
                    className="p-1.5 rounded-md text-lumina-text-muted hover:text-lumina-primary hover:bg-lumina-container-lowest transition-colors cursor-pointer"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openMenuId === cohort.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-lumina-container border border-lumina-border rounded shadow-xl z-20 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cohort.id);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete Class
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="font-sans font-semibold text-xl text-lumina-text tracking-tight leading-snug group-hover:text-lumina-primary transition-colors">
                {cohort.classroomName}
              </h3>
            </div>

            <div className="flex items-center gap-3 text-xs text-lumina-text-muted font-mono mt-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-lumina-text-muted/60" />
                {cohort.subjectCount} Subject{cohort.subjectCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-lumina-container border border-lumina-border rounded-lg max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1 rounded-md text-lumina-text-muted hover:text-lumina-primary hover:bg-lumina-container-lowest transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <h3 className="font-sans font-semibold text-xl text-lumina-text mb-6">
                Add New Classroom
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono tracking-wider uppercase text-lumina-text-muted block mb-1.5">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. O Level Physics"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full py-2 px-3 rounded bg-lumina-container-lowest border border-lumina-border text-sm text-lumina-text focus:outline-none focus:border-lumina-primary transition-all font-sans"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded text-sm font-sans font-medium text-lumina-secondary bg-lumina-container-lowest border border-lumina-border hover:bg-lumina-container-low hover:text-lumina-primary transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded text-sm font-sans font-semibold text-lumina-on-primary bg-lumina-primary hover:bg-lumina-primary-hover transition-all cursor-pointer"
                  >
                    Create Class
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
