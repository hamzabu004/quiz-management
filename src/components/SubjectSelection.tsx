import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  MoreVertical
} from 'lucide-react';
import { Subject, Classroom } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SubjectSelectionProps {
  selectedClassroom: Classroom | null;
  subjects: Subject[];
  onSelectSubject: (subject: Subject) => void;
  onAddSubject: (newSubject: Omit<Subject, 'id'>) => void;
  onDeleteSubject: (id: string) => void;
  onBackToClassrooms: () => void;
}

export default function SubjectSelection({
  selectedClassroom,
  subjects,
  onSelectSubject,
  onAddSubject,
  onDeleteSubject,
  onBackToClassrooms,
}: SubjectSelectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTopicsCount, setNewTopicsCount] = useState(10);
  const [newIconType, setNewIconType] = useState<'math' | 'physics' | 'chemistry' | 'biology' | 'general'>('general');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const levelName = selectedClassroom?.level || 'O Level';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      return;
    }
    onAddSubject({
      name: newSubjectName,
      topicsCount: Number(newTopicsCount),
      mcqsCount: 0,
      classroomLevel: levelName,
      iconType: newIconType,
    });
    setNewSubjectName('');
    setNewTopicsCount(10);
    setNewIconType('general');
    setShowAddModal(false);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex-1 overflow-y-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-lumina-text-muted mb-4 select-none">
        <button 
          onClick={onBackToClassrooms}
          className="hover:text-lumina-primary transition-colors cursor-pointer"
        >
          Classes
        </button>
        <span>&rsaquo;</span>
        <span className="text-lumina-text font-semibold">
          {selectedClassroom?.name || levelName}
        </span>
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="font-sans font-semibold text-3xl tracking-tight text-lumina-text mb-2">
            Select Subject
          </h2>
          <p className="text-sm text-lumina-text-muted max-w-2xl">
            Manage content, questions, and curriculum for your {levelName} students.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 bg-lumina-primary hover:bg-lumina-primary-hover text-lumina-on-primary font-sans font-semibold text-sm rounded transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subj) => (
          <div
            key={subj.id}
            onClick={() => onSelectSubject(subj)}
            className="bg-lumina-container-low border border-lumina-border hover:border-lumina-primary/40 rounded-lg p-6 relative group transition-all duration-300 flex flex-col justify-between cursor-pointer h-32 hover:shadow-[0_4px_30px_rgba(87,241,219,0.03)] active:scale-[0.99]"
          >
            <div>
              {/* Context Menu Only Header */}
              <div className="flex items-center justify-end mb-5">
                <div className="relative">
                  <button
                    onClick={(e) => toggleMenu(e, subj.id)}
                    className="p-1.5 rounded-md text-lumina-text-muted hover:text-lumina-primary hover:bg-lumina-container-lowest transition-colors cursor-pointer"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Context menu for subjects */}
                  {openMenuId === subj.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-lumina-container border border-lumina-border rounded shadow-xl z-20 py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSubject(subj.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete Subject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject details */}
              <h3 className="font-sans font-semibold text-lg text-lumina-text tracking-tight leading-snug group-hover:text-lumina-primary transition-colors mb-2">
                {subj.name}
              </h3>
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center gap-3 text-xs text-lumina-text-muted font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-lumina-text-muted/60" />
                {subj.topicsCount} Topics
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-lumina-text-muted/60" />
                {subj.mcqsCount} MCQs
              </span>
            </div>
          </div>
        ))}

        {/* Outline Create New Subject card */}
        <div
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-lumina-border hover:border-lumina-primary/40 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all h-32 hover:bg-lumina-container-low/20 group text-center"
        >
          <div className="w-10 h-10 rounded-full border border-dashed border-lumina-border group-hover:border-lumina-primary group-hover:bg-lumina-primary/5 flex items-center justify-center text-lumina-text-muted group-hover:text-lumina-primary transition-all mb-3">
            <Plus size={20} />
          </div>
          <span className="font-sans font-medium text-sm text-lumina-text-muted group-hover:text-lumina-primary transition-colors">
            Create New Subject
          </span>
        </div>
      </div>

      {/* Add Subject Modal */}
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

              <h3 className="font-sans font-semibold text-xl text-lumina-text mb-1">
                Create New Subject
              </h3>
              <p className="text-xs text-lumina-text-muted mb-6">
                Register a curriculum topic container under {levelName}.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-mono tracking-wider uppercase text-lumina-text-muted block mb-1.5">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Advanced Mechanics"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
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
                    Create Subject
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
