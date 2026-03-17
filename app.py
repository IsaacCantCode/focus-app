from flask import Flask, send_from_directory, request, Response
import csv
import io

app = Flask(__name__, static_folder='static', static_url_path='')

@app.route('/')
def index():
    """Serve a página principal da aplicação."""
    return send_from_directory('static', 'index.html')

@app.route('/api/export', methods=['POST'])
def export_tasks():
    """
    Recebe as tarefas do Frontend (JSON) e converte-as num ficheiro CSV
    formatado para o utilizador descarregar.
    """
    data = request.json
    tasks = data.get('tasks', [])
    
    # Criar um buffer na memória para o CSV
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Cabeçalho atualizado com os novos campos (Hora e Categoria)
    cw.writerow(['ID', 'Título', 'Descrição', 'Categoria', 'Prioridade', 'Data', 'Hora', 'Estado'])
    
    for t in tasks:
        cw.writerow([
            t.get('id', ''),
            t.get('title', ''),
            t.get('description', ''),
            t.get('category', 'Geral'), # Novo campo
            t.get('priority', 'Média'),
            t.get('date', ''),
            t.get('time', ''),         # Novo campo (Hora)
            t.get('status', 'pendente')
        ])
    
    output = si.getvalue()
    
    # Retorna o ficheiro CSV com os headers de resposta corretos para download
    return Response(
        output,
        mimetype="text/csv",
        headers={
            "Content-disposition": "attachment; filename=foco_tarefas_export.csv",
            "Cache-Control": "no-cache"
        }
    )

if __name__ == '__main__':
    # Executa a aplicação na porta 5000
    print("🚀 Servidor Focus iniciado em http://localhost:5000")
    app.run(debug=True, port=5000)