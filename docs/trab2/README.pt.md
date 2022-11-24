# Segurança Informática - Trabalho 2

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

O erro de programação em questão é uma vulnerabilidade no sistema de autenticação, visto que o atacante pode realizar
um ataque de dicionário para descobrir a password que, juntamente com o salt, gera o hash associado ao utilizador.
Como o atacante tem acesso ao salt, pode gerar todos os hashes possíveis para todas as passwords possíveis, sem
interagir com a interface de autenticação, e comparar com o hash exposto. Caso o hash gerado seja igual ao hash
exposto, o atacante pode então utilizar a password correspondente para se autenticar no servidor, utilizando apenas uma
tentativa na interface de autenticação.

### Exercício 3

**a)** Como a estrutura do cookie é conhecida e é constituida pelo identificador do utilizador e o seu hash,
se a função de hash não for autenticada (e.g. SHA-256), o atacante pode gerar o cookie e fazer-se passar pelo
utilizador.

**b)** Para evitar este ataque, o cookie deve ser gerado no servidor com uma função de hash autenticada (HMAC),
de forma a que o atacante não consiga gerar um cookie válido, pois não tem acesso à chave simétrica que é armazenada
no servidor.

---

### Exercício 4

**a)** O valor indicado no _scope_ é determinado pela **aplicação cliente**. O cliente pode pedir ao utilizador
que escolha os _scopes_ que deseja que a aplicação tenha acesso.

**b)** O cliente e o servidor de autorização comunicam indiretamente através do _browser_ do dono de recursos **quando
o dono de recursos não tem uma sessão ativa no servidor de autorização**.
Neste caso, o cliente redireciona o _browser_ do dono de recursos para o servidor de autorização,
que pede ao dono de recursos para se autenticar.
Após a autenticação, o servidor de autorização redireciona o _browser_ do dono de recursos para o cliente, que recebe
o _access token_ e o _id token_.

**c)** O _access_token_ é um token que permite ao cliente fazer pedidos ao servidor de recursos. Este token é gerado
pelo servidor de autorização sendo enviado para o cliente.
Um _id_token_ é um token que contém informações sobre o utilizador, sendo enviado ao cliente após o processo de
autenticação. Este token tem o formato de um _JSON Web Token_ (JWT), e apenas existe no protocolo _OpenID Connect_.

---

### Exercício 5

**a)** ...

**b)** ...

---

### Exercício 6

**a)**

O servidor HTTPS implementado no exercício 6 encontra-se no ficheiro `https.server.js`.

Para executar o servidor, foi necessário realizar as seguintes configurações:

1. Fazer a configuração adequada do ficheiro `hosts` do sistema operativo, para que o endereço `www.secure-server.edu`
   seja resolvido para `localhost`;
2. Gerar ficheiros `PEM` para a chave privada e certificado do servidor, com recurso ao comando `openssl`, para
   que o servidor possa ser executado com sucesso, sem autenticação do cliente:

   ```bash
   openssl pkcs12 -in secure-server.pfx -nokeys -out certificate.pem -password pass: # Gerar certificado
   openssl pkcs12 -in secure-server.pfx -nocerts -out privatekey.pem --nodes -password pass: # Gerar chave privada não encriptada (--nodes)
   ```

3. Instalar os certificados necessários para o servidor HTTPS:
    * `CA1-int.cer` e `CA2-int.cer` nas _Intermediate Certification Authorities_;
    * `CA1.cer` e `CA2.cer` nas _Trusted Root Certification Authorities_.
4. Gerar o ficheiro `CA2.pem` que contém o certificado da root certificate authority `CA2`, usado para validar o
   certificado do cliente:

   ```bash
    openssl x509 -inform der -in CA2.cer -out CA2.pem
    ```

Para realizar a conexão através do browser com a autenticação do cliente `Alice_2`, foi necessário:

1. Instalar o certificados:
    * `Alice_2.pfx` no _Personal_;
    * `CA1-int.cer` e `CA2-int.cer` nas _Intermediate Certification Authorities_;
    * `CA1.cer` e `CA2.cer` nas _Trusted Root Certification Authorities_.

**b)**

Para realizar a conexão entre o cliente implementado, foi necessário gerar a truststore `truststore.jks` com o
certificado da root certificate authority `CA2` e o intermediário `CA2-int`, usado para validar o certificado do
servidor:

```bash
keytool -importcert -file "CA2.cer" -keystore truststore.jks -alias "CA2"
keytool -importcert -file "CA2-int.cer" -keystore truststore.jks -alias "CA2-int"
```

Esta truststore é então colocada na propriedade `javax.net.ssl.trustStore` do sistema.

---

### Exercício 7

O exercício 7 foi implementado em dois diretórios distintos, `client` e `server`.

...
