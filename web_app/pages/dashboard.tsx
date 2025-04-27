import { useEffect, useState } from 'react';
import { NavBar } from '../components/navbar';
import axios from 'axios';
import AccessDenied from '../components/access-denied';
import { useSession } from 'next-auth/react';

const ContractAnalysis: React.FC = () => {
  const [selectedResponse, setSelectedResponse] = useState<string>('');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [contractText, setContractText] = useState('');
  const { data: session, status } = useSession();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/questionsshort');
      const data = await response.json();
      console.log(data);
      setQuestions(data);
    } catch (error) {
      console.log('Error fetching questions:', error);
    }
  };

  const handleQuestionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuestion(event.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
     console.log(selectedQuestion)
    fetch('http://127.0.0.1:5000/analyze_contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contract_text: contractText,
        question:selectedQuestion
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        setSelectedResponse(data.analysis);

        // Update the response textarea
        const textarea = document.getElementById('response') as HTMLTextAreaElement;
        textarea.value = data.analysis;

        // Update answer colors based on analysis
        const answerElement = document.getElementById('answer-1');
        if (answerElement) {
          answerElement.style.color = 'inherit';
        }
      })
      .catch(error => console.log(error));
  };

  const handleExplanationClick = () => {
    if (selectedResponse !== '') {
      const encodedSelectedResponse = encodeURIComponent(selectedResponse);
      const apiUrl = 'http://127.0.0.1:5000/contracts/paraphrase/' + encodedSelectedResponse;
      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          const htmlContent = data
            .map((element: string) => `<p>${element}</p>`)
            .join('');
          document.getElementById('explanation')!.innerHTML = htmlContent;
        })
        .catch((error) => console.log(error));
    }
  };

  if(status === "unauthenticated") {
    return (
      <>{status}
      <AccessDenied /></>
    )
  }

  return (
    <>
      <div className='titre'>
        <div className='first-word'>Contract Q&A:</div> 
        <div className='complete-phrase'> 
          <span>Unlocking Answers to Vital Questions</span>
        </div>
      </div>
      <div className='dashboard'>
        <form onSubmit={handleFormSubmit}>
          <div className="text-input-container">
            <textarea
              className="contract-text"
              placeholder="Paste your contract text here..."
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              rows={10}
              required
            />
          </div>
          <select 
            name="question" 
            className="select-box"
            value={selectedQuestion}
            onChange={handleQuestionSelect}
            required
          >
            <option value="">Select a question...</option>
            {questions && questions.map((question, index) => (
              <option key={index} value={question}>
                {question}
              </option>
            ))}
          </select>
          <input className="custom-btn btn-8" type="submit" value="Analyze Contract" />
        </form>
        <div className="code-container">
          <section className="augs bg" data-augmented-ui>
            <input className="title" value="Analysis Result" readOnly />
            <div className="code highcontrast-dark">
              <textarea 
                id="response" 
                className="code-textarea" 
                rows={10} 
                placeholder="Analysis result will appear here..." 
                readOnly
              />
            </div>
          </section>
        </div>
        <button className="custom-btn btn-9" onClick={handleExplanationClick}>
          <span>Explain response</span>
        </button>
        <div className="ccode highcontrast-dark" id="explanation"></div>
        <div className="ccode highcontrast-dark" id="analysis"></div>
      </div>
    </>
  );
};

export default ContractAnalysis;
