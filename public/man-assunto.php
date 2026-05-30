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

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Assuntos - Gerenciamento de Colaboradores</title>
</head>

<script>
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
               "infoEmpty": "Sem registros de assuntos ...",
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

     if ($_SESSION['wrkopereg'] == 1) { 
          $_SESSION['wrkcodreg'] = ultimo_cod();
     }
     if ($_SESSION['wrkopereg'] == 3) { 
          $bot = 'Deletar'; 
          $del = "cor-2";
          $per = ' onclick="return confirm(\'Confirma exclusão de assunto informada em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_dados($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_dad();
               if ($ret == 0) {
                    $ret = incluir_dad();
                    $ret = gravar_log(11,"Inclusão de nova assunto: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-assunto.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_dad();
               if ($ret == 0) {
                    $ret = alterar_dad();
                    $ret = gravar_log(12,"Alteração de assunto existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-assunto.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_dad();
               $ret = gravar_log(13,"Exclusão de assunto existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-assunto.php?ope=1&cod=0"</script>'); 
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
                              <h3 class="cor-4"><strong>Manutenção de Assuntos (Produtividade)</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de assuntos para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-assunto.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um assunto dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form class="qua-2" id="tel_c" name="frmTelMan" action="man-assunto.php" method="POST">
                         <div class="row">
                              <div class="col-md-2">
                                   <label>Código</label>
                                   <input type="text" class="form-control text-center" maxlength="6" id="cod" name="cod"
                                        value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                              </div>
                              <div class="col-md-7">
                                   <label>Descrição do Assunto</label>
                                   <input type="text" class="form-control" maxlength="50" id="des" name="des"
                                        value="<?php echo (isset($_REQUEST['des']) == false ? "" : $_REQUEST['des']); ?>"
                                        required />
                              </div>
                              <div class="col-md-1">
                                   <label>Sigla</label>
                                   <input type="text" class="form-control" maxlength="5" id="sig" name="sig"
                                        value="<?php echo (isset($_REQUEST['sig']) == false ? "" : $_REQUEST['sig']); ?>"
                                        required />
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
                         <br />
                         <div class="row text-center">
                              <div class="col-md-5"></div>
                              <div class="col-md-2">
                                   <button type="submit" name="salvar" <?php echo $per; ?>
                                        class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                              </div>
                              <div class="col-md-3"></div>
                         </div>
                         <br />
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
                                                  <th>Descrição do Assunto</th>
                                                  <th>Sigla</th>
                                                  <th>Inclusão</th>
                                                  <th>Alteração</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_dad();  ?>
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
     $nro = acessa_reg('Select idassunto from tb_assunto order by idassunto desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idassunto'] + 1;
     }        
     return $cod;
}

function consiste_dad() {
     $sta = 0;
     if (trim($_REQUEST['des']) == "") {
          echo '<script>alert("Descrição do Assunto não pode estar em branco");</script>';
          return 1;
     }
     return $sta;
}

function ler_dados(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_assunto where idassunto = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código do Assunto informada não cadastrada");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['assstatus'];
          $_REQUEST['des'] = $reg['assdescricao'];
          $_REQUEST['sig'] = $reg['asssigla'];
     }
     return $cha;
}

function carrega_dad() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select * from tb_assunto order by assdescricao, idassunto";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a href="man-assunto.php?ope=2&cod=' . $lin['idassunto'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-assunto.php?ope=3&cod=' . $lin['idassunto'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idassunto'] . '</td>';
          if ($lin['assstatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['assstatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['assstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['assstatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . $lin['assdescricao'] . '</td>';
          $txt .= '<td>' . $lin['asssigla'] . '</td>';
          $txt .= '<td>' . date('d/m/Y H:i:s', strtotime($lin['datinc'])) . '</td>';
          if ($lin['datalt']  == null) {
               $txt .= '<td>' . '' . '</td>';
          } else {
               $txt .= '<td>' . date('d/m/Y H:i:s', strtotime($lin['datalt'])) . '</td>';
          }
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function incluir_dad() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_assunto (";
     $sql .= "assstatus, ";
     $sql .= "assdescricao, ";
     $sql .= "asssigla, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . trim($_REQUEST['des']) . "',";
     $sql .= "'" . trim($_REQUEST['sig']) . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_dad() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "update tb_assunto set ";
     $sql .= "assstatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "assdescricao = '". trim($_REQUEST['des']) . "', ";
     $sql .= "asssigla = '". trim($_REQUEST['sig']) . "', ";
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where idassunto = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_dad() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_assunto where idassunto = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

?>

</html>