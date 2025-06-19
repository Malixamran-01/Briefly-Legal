from flask import Flask, render_template, request, jsonify
from textblob import TextBlob
from io import StringIO
import json
from flask_cors import CORS
import chardet
import requests
import sys

from dotenv import load_dotenv
import os
from config import GEMINI_API_KEY, GEMINI_API_ENDPOINT
from google import genai

# Load environment variables
load_dotenv()

client = genai.Client(api_key="AIzaSyBTtH210mdZTcG84m9V1o4NDJ-xFdjdITU")

app = Flask(__name__)
CORS(app)
answers = []

def load_questions_short():
    questions_short = []
    try:
        with open('data/questions_short.txt', encoding="utf8") as f:
            questions_short = f.readlines()
    except Exception as e:
        print(f"Error loading questions_short.txt: {e}")
    return questions_short

def getContractAnalysis(selected_response):
    print(f"Analyzing response: {selected_response}")
    if selected_response == "":
        return "No answer found in document"
    
    try:
        blob = TextBlob(selected_response)
        polarity = blob.sentiment.polarity
        print(f"Sentiment polarity: {polarity}")

        if polarity > 0:
            return "Positive"
        elif polarity < 0:
            return "Negative"
        else:
            return "Neutral"
    except Exception as e:
        print(f"Error analyzing text: {e}")
        return "Analysis error"

questions_short = load_questions_short()

@app.route('/questionsshort')
def getQuestionsShort():
    return jsonify(questions_short)

@app.route("/analyze_contract", methods=["POST"])
def analyze_contract():
    try:
        data = request.get_json(force=True)
        contract_text = data.get('contract_text', '')
        selected_ques = data.get('question', '')
       
        if not contract_text:
            return jsonify({"error": "Contract text missing"}), 400

        # First, analyze the entire contract
        analysis_prompt = f"""You are a legal contract analysis expert. Analyze the following contract text thoroughly.
        Focus on key terms, obligations, rights, and important clauses.

        Contract Text:
        {contract_text}

        Provide a short analysis of contract and answer the question Ques{selected_ques} provide answer in simple text format don't use bold letters for headings"""

        # Get the contract analysis
        print("Prompt:\n", analysis_prompt, file=sys.stderr)

        response = client.models.generate_content(
            model="gemini-2.0-flash",  # Use a valid model name
            contents=analysis_prompt
        )

        # try:
        #     output_text = response.text
        # except AttributeError:
        #     output_text = response.parts[0].text

        # print("Gemini Output:\n", output_text, file=sys.stderr)

        # try:
        #     parsed_json = json.loads(output_text)
        # except json.JSONDecodeError:
        #     parsed_json = {"error": "Response is not valid JSON", "raw_output": output_text}

        return jsonify({
            "analysis": response.text,
            "question": analysis_prompt
        })

    except Exception as e:
        print(f"Error in analyze_contract: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/get_response', methods=['POST'])
def get_response():
    try:
        question = request.form['selected_response']
        if not question:
            return jsonify({"message": "Question is missing"}), 400

        with open('responses.json', 'r') as file:
            responses = json.load(file)
            for response in responses:
                if response['question'] == question:
                    return jsonify({"answer": response['answer']})

        return jsonify({"message": "Response not found"}), 404

    except Exception as e:
        print(f"Error reading responses: {e}")
        return jsonify({"message": "Error processing request"}), 500

if __name__ == '__main__':
    app.run(debug=True)
