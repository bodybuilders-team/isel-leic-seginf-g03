# Segurança Informática - Fase 2

> Segunda fase do projeto de Segurança Informática do grupo 03 da turma LEIC51D.

The English version of this document is available [here](README.md).

## Autores

- [48089 André Páscoa](https://github.com/devandrepascoa)
- [48280 André Jesus](https://github.com/andre-j3sus)
- [48287 Nyckollas Brandão](https://github.com/Nyckoka)

Professor: Eng. José Simão

@ISEL<br>
Licenciatura em Engenharia Informática e de Computadores<br>
Segurança Informática - LEIC51D - Grupo 03<br>
Semestre de Inverno 2022/2023

---

---

## Exercícios

### Exercício 1

**a)** A autenticidade das mensagens no _record protocol_ é garantida através da utilização de um MAC (Message
Authentication Code), sendo calculado sobre a mensagem e o seu respetivo segredo partilhado. Este MAC é então enviado
juntamente com a mensagem, de forma a que o receptor possa verificar a sua autenticidade.

**b)** A deteção de inserção ou adulteração maliciosa de mensagens é feita através da mensagem **Finished** que é
enviada no fim do handshake, indicando que o handshake foi concluído com sucesso no cliente. Esta mensagem contém
um MAC que é calculado sobre o segredo partilhado e o respetivo hash do handshake. O servidor então calcula o seu
próprio MAC e compara-o com o MAC recebido, verificando se o handshake foi concluído com sucesso e que não houve
alterações maliciosas.

**c)** A utilização de chaves públicas e privadas para estabelecer o _pre-master secret_ não garante a propriedade
**perfect forward security**, porque a chave privada do servidor é partilhada com o cliente, permitindo que este
possa decifrar as mensagens enviadas pelo servidor. Desta forma, se o servidor for comprometido, o cliente pode
continuar a decifrar todas as mensagens enviadas pelo servidor, mesmo que o cliente tenha trocado as suas chaves.

---

### Exercício 2

O erro de programação em questão permite que um atacante possa obter a lista de utilizadores, hashs e salts da aplicação
web, o que facilita um ataque de dicionário através da interface de autenticação, pois o atacante pode tentar todas as
passwords possíveis para cada utilizador, sem ter de se preocupar com o salt, uma vez que este é conhecido.
Contudo, o ataque de dicionário através da interface de autenticação é limitado pelo número de tentativas que o atacante
pode fazer, o que pode ser um problema, pois o atacante pode não conseguir descobrir todas as passwords.

### Exercício 3

**a)** O atacante pode fazer-se passar por outro utilizador para o qual sabe o seu identificador, alterando o cookie
guardado no browser. 

**b)** Para evitar este ataque, ...

---

### Exercício 4

**a)** ...

**b)** ...

**c)** ...

---

### Exercício 5

**a)** ...

**b)** ...
