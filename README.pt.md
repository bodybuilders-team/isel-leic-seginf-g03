# isel-leic-seginf-g03

> Projecto de Segurança Informática do grupo 03 da turma LEIC51D.

The English version of this document is available [here](README.md).

## Autores

- [André Páscoa](https://github.com/devandrepascoa)
- [André Jesus](https://github.com/andre-j3sus)
- [Nyckollas Brandão](https://github.com/Nyckoka)

Professor: Eng. José Simão

@ISEL<br>
Licenciatura em Engenharia Informática e de Computadores<br>
Segurança Informática - LEIC51D - Grupo 03<br>
Semestre de Inverno 2022/2023

---

---

## Exercícios

### Exercício 1

#### 1.1

`xi = D(k)(yi) XOR RV`

#### 1.2

**a)** Como RV é constante para todos os blocos, ao aplicar RV com a operação XOR bit a bit, os padrões do texto
original vão se manter. Isto significa que apesar de os bits mudarem, caso existam blocos xi com bits iguais, não haverá
diferença nos seus blocos cifrados.

**b)** Ao produzir a cifra com o modo de operação CBC, cada bloco cifrado vai necessitar que o bloco anterior já tenha
sido cifrado, daí não ser possível fazer paralelização. No caso da decifra, é possível ser paralelizada porque não
existe essa dependência. Com este modo de operação, como RV é constante, não existe dependência entre os blocos, ou
seja, é possível paralelizar a cifra e decifra.

---

### Exercício 2

Na abordagem descrita no RFC 4880, a mensagem é cifrada com um algoritmo simétrico, e a chave usada para cifrar a
mensagem é cifrada com a chave pública do destinatário. Desta forma, o destinatário pode decifrar a mensagem usando a
sua chave privada, e a chave simétrica para decifrar a mensagem.

A utilização desta abordagem é justificada pelo facto de o algoritmo simétrico ser mais rápido que o algoritmo
assimétrico. Não é utilizada a chave pública para cifrar a mensagem, pois este processo é muito mais lento do que a
utilização de uma chave simétrica. Como a chave simétrica é de um tamanho muito menor que a chave pública, o processo de
cifra e decifra é muito mais rápido.

O processo de decifra de uma mensagem é o seguinte:

1. A mensagem é cifrada com uma chave simétrica;
2. A chave simétrica é cifrada com a chave pública do destinatário;
3. A mensagem e a chave simétrica cifrada são enviadas para o destinatário;
4. O destinatário decifra a chave simétrica com a sua chave privada;
5. O destinatário decifra a mensagem com a chave simétrica decifrada.

### Exercício 3

#### 3.1

O método `sign()` da class `Signature` é usado para gerar a assinatura digital de um documento. Esta assinatura digital
é gerada ao cifrar a hash do documento a ser assinado com a chave privada do emissor. Para gerar a assinatura digital, o
emissor utiliza a função `initSign(PrivateKey privateKey)` para inicializar a assinatura digital com a chave privada.
Depois, o emissor utiliza a função `update(byte[] data)` para atualizar a hash do documento a ser assinado. Por fim, o
emissor utiliza a função `sign()` para gerar a assinatura digital do documento do hash calculado até ao momento.

#### 3.2

Caso seja computacionalmente fazível obter uma nova mensagem que produza a mesma hash que a mensagem original, seria
possível alterar a mensagem sem que o recetor percebesse. Isto porque ao verificar a assinatura digital, a hash extraída
da assinatura digital seria igual à hash da mensagem alterada.

---

### Exercício 4

...

---

### Exercício 5

O quinto exercício está implementado na diretoria [exercise5](./src/main/kotlin/exercise5).

O objetivo deste exercício foi implementar uma aplicação que realize geração de hashs cripográficos de ficheiros.
A aplicação recebe dois argumentos na linha de comandos:

1. O nome da função de hash (e.g. SHA-256, SHA-1, etc);
2. O ficheiro para o qual se quer obter o hash.

Na resolução deste exercício, foi utilizada a class `DigestInputStream` da biblioteca JCA, para realizar a leitura do
ficheiro e a geração do hash.

---

### Exercício 6

O sexto exercício está implementado na diretoria [exercise6](./src/main/kotlin/exercise6).

O objetivo deste exercício foi implementar uma aplicação que cifre e decifre ficheiros com um esquema híbrido, como o
descrito no exercício 2.
A aplicação recebe na linha de comandos a opção para cifrar (`-enc`) ou decifrar (`-dec`) e o ficheiro para
cifrar/decifrar.

No modo para cifrar, a aplicação também recebe:

1. O ficheiro para cifrar;
2. O certificado com a chave pública do destinatário;
3. O ficheiro para guardar a mensagem cifrada;
4. O ficheiro para guardar a chave simétrica cifrada.

No modo para decifrar, a aplicação recebe:

1. O ficheiro para decifrar;
2. O ficheiro com a chave simétrica cifrada;
3. O keystore com a chave privada do destinatário;
4. A password do keystore;
5. A alias da chave privada;
6. O ficheiro para guardar a mensagem decifrada.

Foram implementadas duas funções:

* `encrypt` - para cifrar um ficheiro;
* `decrypt` - para decifrar um ficheiro.
