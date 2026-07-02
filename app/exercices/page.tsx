'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const exercicesDemo = [
  {
    id: 1,
    question: "Qu'est-ce que la vitesse de réaction ?",
    type: 'qcm',
    options: [
      "La quantité de matière produite",
      "La variation de concentration par unité de temps",
      "La température du milieu réactionnel",
      "La pression du système"
    ],
    reponse: 1
  },
  {
    id: 2,
    question: "Quel facteur n'influence PAS la vitesse de réaction ?",
    type: 'qcm',
    options: [
      "La température",
      "La concentration des réactifs",
      "La couleur du récipient",
      "La présence d'un catalyseur"
    ],
    reponse: 2
  },
  {
    id: 3,
    question: "Lorsqu'on augmente la température, la vitesse de réaction...",
    type: 'qcm',
    options: [
      "Diminue",
      "Ne change pas",
      "Augmente",
      "Dépend du catalyseur"
    ],
    reponse: 2
  }
]

export default function Exercices() {
  const [reponses, setReponses] = useState<{[key: number]: number}>({})
  const [valide, setValide] = useState(false)
  const [score, setScore] = useState(0)

  const handleReponse = (id: number, index: number) => {
    if (valide) return
    setReponses(prev => ({ ...prev, [id]: index }))
  }

  const handleValider = () => {
    let s = 0
    exercicesDemo.forEach(ex => {
      if (reponses[ex.id] === ex.reponse) s++
    })
    setScore(s)
    setValide(true)
  }

  const handleRecommencer = () => {
    setReponses({})
    setValide(false)
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Exercices — Cinétique chimique</h1>
        <p className="text-gray-500 text-sm mb-8">3 questions · QCM</p>

        <div className="space-y-6">
          {exercicesDemo.map((ex) => (
            <div key={ex.id} className="bg-white rounded-xl shadow-sm p-6">
              <p className="font-medium mb-4">{ex.id}. {ex.question}</p>
              <div className="space-y-2">
                {ex.options.map((opt, i) => {
                  const choisi = reponses[ex.id] === i
                  const correct = ex.reponse === i
                  let style = "w-full text-left px-4 py-2 rounded-lg border text-sm transition "
                  if (!valide) {
                    style += choisi ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  } else {
                    if (correct) style += "border-green-500 bg-green-50 text-green-700"
                    else if (choisi) style += "border-red-400 bg-red-50 text-red-600"
                    else style += "opacity-50"
                  }
                  return (
                    <button key={i} className={style} onClick={() => handleReponse(ex.id, i)}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {!valide ? (
          <button
            onClick={handleValider}
            disabled={Object.keys(reponses).length < exercicesDemo.length}
            className="mt-8 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            Valider mes réponses
          </button>
        ) : (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-3xl font-bold mb-2">{score}/{exercicesDemo.length}</p>
            <p className="text-gray-500 mb-4">
              {score === exercicesDemo.length ? "Parfait ! 🎉" : score >= 2 ? "Bon travail ! 💪" : "Continue à réviser 📚"}
            </p>
            <button onClick={handleRecommencer} className="text-blue-600 text-sm underline">
              Recommencer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}