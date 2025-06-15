import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle, Search } from "lucide-react";

const FAQ = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = (index) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqData = [
    {
      category: "Vehicle Registration",
      questions: [
        {
          question: "How do I register my vehicle?",
          answer:
            "To register your vehicle, navigate to the Vehicle Registration section from the dashboard. Fill in all required vehicle details, owner information, and schedule an inspection appointment. After successful inspection and fee payment, your vehicle will be registered on the blockchain.",
        },
        {
          question: "What documents do I need for vehicle registration?",
          answer:
            "You need your CNIC, vehicle purchase documents, engine and chassis numbers, and any previous registration documents if applicable.",
        },
        {
          question: "How long does the registration process take?",
          answer:
            "The registration process typically takes 3-5 business days after your inspection appointment.",
        },
        {
          question: "Can I track my registration status?",
          answer:
            "Yes, you can track your registration status on the dashboard.",
        },
      ],
    },
    {
      category: "Inspections",
      questions: [
        {
          question: "What happens during a vehicle inspection?",
          answer:
            "Inspectors verify your vehicle's engine number, chassis number, and overall condition.",
        },
        {
          question: "Can I reschedule my inspection appointment?",
          answer:
            "You need to contact support to reschedule appointments.",
        },
        {
          question: "What if my vehicle fails inspection?",
          answer:
            "You will get detailed feedback and can reapply after fixing the issues.",
        },
      ],
    },
    {
      category: "Payments & Fees",
      questions: [
        {
          question: "How much does vehicle registration cost?",
          answer:
            "Fees vary by vehicle. Exact fees are shown during the process.",
        },
        {
          question: "What payment methods are accepted?",
          answer:
            "We accept cryptocurrency payments via MetaMask.",
        },
        {
          question: "Is my payment secure?",
          answer:
            "Yes. All payments are processed via blockchain technology.",
        },
      ],
    },
    {
      category: "Technical Support",
      questions: [
        {
          question: "I can't connect my MetaMask wallet. What should I do?",
          answer:
            "Ensure MetaMask is installed and unlocked, and you're on the correct network.",
        },
        {
          question: "How do I view my vehicle NFT?",
          answer:
            "Click 'View NFT' in your dashboard after successful registration.",
        },
        {
          question: "Can I access my account from multiple devices?",
          answer:
            "Yes. Just use your MetaMask wallet on any device.",
        },
      ],
    },
  ];

  const filteredFAQs = faqData
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (item) =>
          item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-400">Common queries answered for your convenience</p>
        </div>

        <div className="relative mb-10 max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search FAQs..."
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredFAQs.map((category, idx) => (
          <div key={idx} className="mb-8 border border-indigo-500/20 rounded-xl bg-gray-800 p-6">
            <h2 className="text-xl font-semibold text-indigo-400 mb-4">{category.category}</h2>
            <div className="space-y-3">
              {category.questions.map((item, index) => {
                const key = `${idx}-${index}`;
                const isOpen = openItems[key];

                return (
                  <div key={index} className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                    <button
                      className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-800"
                      onClick={() => toggleItem(key)}
                    >
                      <span>{item.question}</span>
                      {isOpen ? (
                        <ChevronUp className="text-indigo-400 w-5 h-5" />
                      ) : (
                        <ChevronDown className="text-indigo-400 w-5 h-5" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-gray-300 border-t border-gray-700">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredFAQs.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            No matching questions found.
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ;
