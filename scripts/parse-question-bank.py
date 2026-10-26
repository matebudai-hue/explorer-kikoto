import re,json,hashlib,sys
from pathlib import Path
src=Path(sys.argv[1]).read_text()
questions=[]
for number,block in re.findall(r'### KÉRDÉS (\d+)\s*\n(.*?)(?=\n### KÉRDÉS|\nÖsszesen:|\Z)',src,re.S):
 def field(name):
  m=re.search(r'^'+name+r':\s*(.+)$',block,re.M);assert m,(number,name);return m.group(1).strip()
 kind=field('Típus');q={'id':f'day2-bank-q{int(number):02}','title':field('Kérdés'),'explanation':field('Magyarázat'),'max':10,'page':int(re.findall(r'\d+',field('Forrás'))[0]),'sourcePages':[int(v) for v in re.findall(r'\d+',field('Forrás'))],'revision':'day2-bank-v1'}
 correct=field('Helyes válasz')
 if kind=='rövid szöveges válasz':q.update(type='text',options=[],correct=[],accepted=[a.strip() for a in correct.split(',')])
 elif kind=='igaz/hamis':q.update(type='single',options=['Igaz','Hamis'],correct=[['Igaz','Hamis'].index(correct)])
 elif kind=='párosítás':
  left=block.split('Bal oldal:')[1].split('Jobb oldal:')[0];right=block.split('Jobb oldal:')[1].split('Helyes válasz:')[0]
  rows=re.findall(r'^\d+\) (.+)$',left,re.M);options=re.findall(r'^[A-Z]\) (.+)$',right,re.M);pairs=dict((int(a),ord(b)-65) for a,b in re.findall(r'(\d+)-([A-Z])',correct));q.update(type='match',rows=rows,options=options,correct=[pairs[i+1] for i in range(len(rows))])
 else:
  options=re.findall(r'^[A-Z]\) (.+)$',block.split('Helyes válasz:')[0],re.M);answers=[ord(v)-65 for v in re.findall('[A-Z]',correct)]
  if kind=='sorba rendezés':q.update(type='match',layout='order',rows=[f'{i+1}. lépés' for i in range(len(options))],options=options,correct=answers)
  else:q.update(type='multi' if kind=='több helyes válasz' else 'single',options=options,correct=answers)
  if q['type']=='multi':q['choose']=len(answers)
 assert q['title'] and q['explanation'];questions.append(q)
assert len(questions)==40
assert len(set(q['id'] for q in questions))==40
out={'sourceSha256':hashlib.sha256(src.encode()).hexdigest(),'questions':questions}
Path(sys.argv[2]).write_text(json.dumps(out,ensure_ascii=False,indent=2))
from collections import Counter
print(json.dumps({'questions':len(questions),'types':dict(Counter(q['type']+('-order' if q.get('layout') else '') for q in questions))},ensure_ascii=False))
