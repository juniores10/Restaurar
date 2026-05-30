<?php session_start(); ?>
<!DOCTYPE html>
<html lang="pt_br">

<head>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
     <meta name="description" content="Profsa Informática - Gerenciamento de Colaboradores" />
     <meta name="author" content="Paulo Rogério Souza" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />

     <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet" type="text/css" />
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400" rel="stylesheet" type="text/css" />

     <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.css">

     <link rel="shortcut icon" href="https://www.profsa.com.br/pallas56/img/logo-00.png" />

     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

     <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous">
     </script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
          integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous">
     </script>

     <script type="text/javascript" language="javascript"
          src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
     <link href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css" />

     <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
     <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <script type="text/javascript" src="js/datepicker-pt-BR.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Usuários - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $("#tel").mask("(00) 0000-0000");
     $("#cel").mask("(00)0-0000-0000");
     $("#val").mask("00/00/0000");
     $("#val").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {
     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [4, 'asc'],
               [2, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de usuários ...",
               "sSearch": "Buscar:",
               "infoFiltered": "(Consulta de _TOTAL_/_MAX_ total de linhas)",
               "oPaginate": {
                    sFirst: "Primeiro",
                    sLast: "Último",
                    sNext: "Próximo",
                    sPrevious: "Anterior"
               }
          }
     });

     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
     });

     $("#val").blur(function() {
          if ($("#val").val() == "") {
               var dat = new Date;
               var ddd = ('0' + dat.getDate()).slice(-2);
               var mmm = ('0' + (dat.getMonth() + 1)).slice(-2);
               var aaa = dat.getFullYear();
               dat = ddd + "/" + mmm + "/" + (parseFloat(aaa, 10) + 5);
               $('#val').val(dat);
          }
     });

     $('#car_f').bind("click", function() {
          $('#doc_j').click();
     });

     $("#tel_c").submit(function() {
          let ret = carregar_fot();
     });

     $(window).scroll(function() {
          if ($(this).scrollTop() > 100) {
               $(".subir").fadeIn(500);
          } else {
               $(".subir").fadeOut(250);
          }
     });

     $(".subir").click(function() {
          $topo = $("#box00").offset().top;
          $('html, body').animate({
               scrollTop: $topo
          }, 1500);
     });

     function carregar_fot() {
          let ret = 0;
          var cam = $('#doc_j').val();
          fot_f = new FormData();
          fot_f.append('arq-fot', $('#doc_j').prop('files')[0]);
          $.ajax({
               url: 'ajax/usu-upl-imagem.php?cam=' + cam,
               data: fot_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#ima_u').attr('src', data.fot);
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de foto de funcionário"
                    );
               }
          });
          return ret;
     }
});
</script>

<?php
     $ret = 0; 
     $per = "";
     $del = "";
     $bot = "Salvar";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrkopereg']) == false) { $_SESSION['wrkopereg'] = 0; }
     if (isset($_SESSION['wrkcodreg']) == false) { $_SESSION['wrkcodreg'] = 0; }
     if (isset($_REQUEST['ope']) == true) { $_SESSION['wrkopereg'] = $_REQUEST['ope']; }
     if (isset($_REQUEST['cod']) == true) { $_SESSION['wrkcodreg'] = $_REQUEST['cod']; }

     if ($_SESSION['wrktipusu'] != 2) {
          echo '<script>alert("Usuário não tem permissão de acesso a esta operação");</script>';
          exit('<script>location.href = "menu02.php"</script>');           
     }

     if ($_SESSION['wrkopereg'] == 1) { 
          $_SESSION['wrkcodreg'] = ultimo_cod();
     }
     if ($_SESSION['wrkopereg'] == 3) { 
          $bot = 'Deletar'; 
          $del = "cor-2";
          $per = ' onclick="return confirm(\'Confirma exclusão de usuário informado em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_usuario($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_usu();
               if ($ret == 0) {
                    $ret = incluir_usu();
                    $ret = gravar_log(11,"Inclusão de nova usuário: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-usuario.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_usu();
               if ($ret == 0) {
                    $ret = alterar_usu();
                    $ret = gravar_log(12,"Alteração de usuário existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-usuario.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_usu();
               $ret = gravar_log(13,"Exclusão de usuário existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-usuario.php?ope=1&cod=0"</script>'); 
          }
     }

?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div class="col-md-10">
                    <br />
                    <div class="row">
                         <div class="col-md-10">
                              <h3 class="cor-4"><strong>Manutenção de Usuários</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de usuários para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-usuario.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais uma usuário dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form class="qua-2" id="tel_c" name="frmTelMan" action="man-usuario.php" method="POST"
                         enctype="multipart/form-data">
                         <div class="row">
                              <div class="col-md-2">
                                   <label>Código</label>
                                   <input type="text" class="form-control text-center" maxlength="6" id="cod" name="cod"
                                        value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                              </div>
                              <div class="col-md-6">
                                   <label>Nome do Funcionário</label>
                                   <input type="text" class="form-control" maxlength="50" id="nom" name="nom"
                                        value="<?php echo (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom']); ?>"
                                        required />
                              </div>
                              <div class="col-md-2">
                                   <label>Tipo</label>
                                   <select name="tip" class="form-control">
                                        <option value="0"
                                             <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 0 ? '' : 'selected="selected"'); ?>>
                                             Funcionário</option>
                                        <option value="1"
                                             <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 1 ? '' : 'selected="selected"'); ?>>
                                             Líder/Supervisor</option>
                                        <option value="2"
                                             <?php echo ((isset($_REQUEST['tip']) == false ? 0 : $_REQUEST['tip']) != 2 ? '' : 'selected="selected"'); ?>>
                                             Administrador</option>
                                   </select>
                              </div>
                              <div class="col-md-2">
                                   <label>Status</label>
                                   <select name="sta" class="form-control">
                                        <option value="0"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 0 ? '' : 'selected="selected"'); ?>>
                                             Normal
                                        </option>
                                        <option value="1"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 1 ? '' : 'selected="selected"'); ?>>
                                             Bloqueado</option>
                                        <option value="2"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 2 ? '' : 'selected="selected"'); ?>>
                                             Suspenso</option>
                                        <option value="3"
                                             <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 3 ? '' : 'selected="selected"'); ?>>
                                             Cancelado</option>
                                   </select>
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-2"></div>
                              <div class="col-md-2">
                                   <label>Telefone</label>
                                   <input type="text" class="form-control text-center" maxlength="15" id="tel"
                                        name="tel"
                                        value="<?php echo (isset($_REQUEST['tel']) == false ? "" : $_REQUEST['tel']); ?>" />
                              </div>
                              <div class="col-md-1"></div>
                              <div class="col-md-2">
                                   <label>Celular</label>
                                   <input type="text" class="form-control text-center" maxlength="50" id="cel"
                                        name="cel"
                                        value="<?php echo (isset($_REQUEST['cel']) == false ? "" : $_REQUEST['cel']); ?>" />
                              </div>
                              <div class="col-md-1"></div>
                              <div class="col-md-2">
                                   <label>Senha</label>
                                   <input type="text" class="form-control text-center" maxlength="10" id="sen"
                                        name="sen"
                                        value="<?php echo (isset($_REQUEST['sen']) == false ? "" : $_REQUEST['sen']); ?>"
                                        required />
                              </div>
                              <div class="col-md-2"></div>
                         </div>
                         <div class="row">
                              <div class="col-md-2"></div>
                              <div class="col-md-8">
                                   <label>E-Mail</label>
                                   <input type="email" class="form-control" maxlength="50" id="ema" name="ema"
                                        value="<?php echo (isset($_REQUEST['ema']) == false ? "" : $_REQUEST['ema']); ?>"
                                        required />
                              </div>
                              <div class="col-md-2"></div>
                         </div>
                         <br />
                         <div class="row text-center">
                              <div class="col-md-5"></div>
                              <div class="col-md-2">
                                   <button type="submit" name="salvar" <?php echo $per; ?>
                                        class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                              </div>
                              <div class="col-md-3"></div>
                              <div class="col-md-2">
                                   <i id="car_f" class="cur-1 fa fa-id-badge fa-3x" aria-hidden="true"
                                        title="Abre janela para carrega foto do usuário do sistema."></i>
                              </div>
                         </div>
                         <br />
                         <input type="file" id="doc_j" class="bot-3" accept=".jpg, .png, .jpeg" />
                    </form>
                    <div class="container-fluid">
                         <hr />
                         <div class="row">
                              <div class="tab-1 table-responsive">
                                   <table id="tab-0" class="table table-sm table-striped">
                                        <thead>
                                             <tr>
                                                  <th width="2%" class="text-center">Alterar</th>
                                                  <th width="2%" class="text-center">Excluir</th>
                                                  <th width="2%" class="text-center">Código</th>
                                                  <th>Status</th>
                                                  <th>Nome do Usuário</th>
                                                  <th>Tipo</th>
                                                  <th>Telefone</th>
                                                  <th>Celular</th>
                                                  <th>E-Mail</th>
                                                  <th>Acessos</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_usu();  ?>
                                        </tbody>
                                   </table>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
          <div class="row">
               <img class="subir" src="img/subir.png" />
          </div>
     </div>
</body>

<?php
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select idsenha from tb_usuario order by idsenha desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idsenha'] + 1;
     }        
     return $cod;
}

function consiste_usu() {
     $sta = 0;
     include_once "dados.php";     
     if (trim($_REQUEST['nom']) == "") {
          echo '<script>alert("Nome do Usuário não pode estar em branco");</script>';
          return 1;
     }
     if (trim($_REQUEST['ema']) == "") {
          echo '<script>alert("E-Mail do Usuário não pode estar em branco");</script>';
          return 1;
     }
     if (trim($_REQUEST['sen']) == "") {
          echo '<script>alert("Senha do Usuário não pode estar em branco");</script>';
          return 1;
     }
     if ($_REQUEST['tip'] > $_SESSION['wrktipusu']) {
          echo '<script>alert("Usuário não pode informar nível maior que o seu");</script>';
          return 1;
     }
     $nro = acessa_reg("Select idsenha from tb_usuario where usuemail = '" . $_REQUEST['ema'] . "'", $reg);       
     if ($nro > 0) {
          if ($reg['idsenha'] != 0 && $reg['idsenha'] != $_SESSION['wrkcodreg']) {
               echo '<script>alert("E-mail informado para usuário já existe cadastrado");</script>';
               return 1;
          }
     }
     return $sta;
}

function ler_usuario(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_usuario where idsenha = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código da Função informada não cadastrada");</script>';
          $nro = 1;
     } else {
          $_REQUEST['tip'] = $reg['usutipo'];
          $_REQUEST['sta'] = $reg['usustatus'];
          $_REQUEST['nom'] = $reg['usunome'];
          $_REQUEST['tel'] = $reg['usutelefone'];
          $_REQUEST['cel'] = $reg['usucelular'];
          $_REQUEST['ema'] = $reg['usuemail'];
          $_REQUEST['sen'] =  base64_decode($reg['ususenha']);
          $_SESSION['wrkchareg'] = $reg['idsenha'];
     }
     return $cha;
}

function carrega_usu() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select * from tb_usuario order by usunome, idsenha";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a href="man-usuario.php?ope=2&cod=' . $lin['idsenha'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-usuario.php?ope=3&cod=' . $lin['idsenha'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idsenha'] . '</td>';
          if ($lin['usustatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['usustatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['usustatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['usustatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . $lin['usunome'] . '</td>';
          if ($lin['usutipo'] == 0) {$txt .= "<td>" . "Funcionário" . "</td>";}
          if ($lin['usutipo'] == 1) {$txt .= "<td>" . "Líder/Supervisor" . "</td>";}
          if ($lin['usutipo'] == 2) {$txt .= "<td>" . "Administrador" . "</td>";}
          $txt .= '<td>' . $lin['usutelefone'] . '</td>';
          $txt .= '<td>' . $lin['usucelular'] . '</td>';
          $txt .= '<td>' . $lin['usuemail'] . '</td>';          
          $txt .= '<td class="text-center">' . $lin['usuacessos'] . '</td>';          
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function incluir_usu() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_usuario (";
     $sql .= "usutipo, ";
     $sql .= "usustatus, ";
     $sql .= "usunome, ";
     $sql .= "usuemail, ";
     $sql .= "ususenha, ";
     $sql .= "usutelefone, ";
     $sql .= "usucelular, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . $_REQUEST['tip'] . "',";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . trim($_REQUEST['nom']) . "',";
     $sql .= "'" . trim($_REQUEST['ema']) . "',";
     $sql .= "'" . base64_encode($_REQUEST['sen']) . "',";
     $sql .= "'" . trim($_REQUEST['tel']) . "',";
     $sql .= "'" . trim($_REQUEST['cel']) . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     $_SESSION['wrkchareg'] = $ult;
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_usu() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "update tb_usuario set ";
     $sql .= "usutipo = '". $_REQUEST['tip'] . "', ";
     $sql .= "usustatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "usunome = '". trim($_REQUEST['nom']) . "', ";
     $sql .= "usutelefone = '". trim($_REQUEST['tel']) . "', ";
     $sql .= "usucelular = '". trim($_REQUEST['cel']) . "', ";
     $sql .= "usuemail = '". trim($_REQUEST['ema']) . "', ";
     $sql .= "ususenha = '". base64_encode($_REQUEST['sen']) . "', ";
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where idsenha = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_usu() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_usuario where idsenha = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

?>

</html>