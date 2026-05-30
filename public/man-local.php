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

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Locais - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $("#tel").mask("(00) 0000-0000");
     $("#cel").mask("(00)0-0000-0000");
     $("#cep").mask("00000-000");
     $("#num").mask("000.000", {
          reverse: true
     });
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
               "infoEmpty": "Sem registros de locais ...",
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

     $('#cep').blur(function() {
          var cep = $('#cep').val();
          var cep = cep.replace(/[^0-9]/g, '');
          if (cep != '') {
               var url = '//viacep.com.br/ws/' + cep + '/json/';
               $.getJSON(url, function(data) {
                    if ("error" in data) {
                         return;
                    }
                    if ($('#end').val() == "") {
                         $('#end').val(data.logradouro.substring(0, 50));
                    }
                    if ($('#cep').val() == "" || $('#cep').val() == "-") {
                         $('#cep').val(data.cep.replace('.', ''));
                    }
                    if ($('#bai').val() == "") {
                         $('#bai').val(data.bairro.substring(0, 50));
                    }
                    if ($('#cid').val() == "") {
                         $('#cid').val(data.localidade);
                    }
                    if ($('#est').val() == "") {
                         $('#est').val(data.uf);
                    }
                    if ($('#mun').val() == "") {
                         $('#mun').val(data.ibge);
                    }
               });
          }
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
          $per = ' onclick="return confirm(\'Confirma exclusão de local informada em tela ?\')" ';
     }  

     if ($_SESSION['wrkopereg'] == 2 || $_SESSION['wrkopereg'] == 3) {
          if (isset($_REQUEST['salvar']) == false) { 
               $cha = $_SESSION['wrkcodreg']; $_SESSION['wrknumcha'] = $_SESSION['wrkcodreg']; 
               $ret = ler_local($_SESSION['wrkcodreg']); 
          }
     }

     if (isset($_REQUEST['salvar']) == true) {
          if ($_SESSION['wrkopereg'] == 1) {
               $ret = consiste_loc();
               if ($ret == 0) {
                    $ret = incluir_loc();
                    $ret = gravar_log(11,"Inclusão de nova local: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-local.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 2) {
               $ret = consiste_loc();
               if ($ret == 0) {
                    $ret = alterar_loc();
                    $ret = gravar_log(12,"Alteração de local existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
                    exit('<script>location.href = "man-local.php?ope=1&cod=0"</script>'); 
               }
          }
          if ($_SESSION['wrkopereg'] == 3) {
               $ret = excluir_loc();
               $ret = gravar_log(13,"Exclusão de local existente: " . (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom'])); $_SESSION['wrkcodreg'] = ultimo_cod();
               exit('<script>location.href = "man-local.php?ope=1&cod=0"</script>'); 
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
                              <h3 class="cor-4"><strong>Manutenção de Locais</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de locais para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-local.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um local dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form class="qua-2" id="tel_c" name="frmTelMan" action="man-local.php" method="POST">
                         <div class="row">
                              <div class="col-md-2">
                                   <label>Código</label>
                                   <input type="text" class="form-control text-center" maxlength="6" id="cod" name="cod"
                                        value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                              </div>
                              <div class="col-md-6">
                                   <label>Nome do Local</label>
                                   <input type="text" class="form-control" maxlength="75" id="des" name="des"
                                        value="<?php echo (isset($_REQUEST['des']) == false ? "" : $_REQUEST['des']); ?>"
                                        required />
                              </div>
                              <div class="col-md-2">
                                   <label>Nome Resumido</label>
                                   <input type="text" class="form-control" maxlength="10" id="res" name="res"
                                        value="<?php echo (isset($_REQUEST['res']) == false ? "" : $_REQUEST['res']); ?>"
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
                         <div class="row">
                              <div class="col-md-2">
                                   <label>C.e.p.</label>
                                   <input type="text" class="form-control" maxlength="9" id="cep" name="cep"
                                        value="<?php echo (isset($_REQUEST['cep']) == false ? "" : $_REQUEST['cep']); ?>" />
                              </div>
                              <div class="col-md-8"></div>
                              <div class="col-md-2">
                                   <label>Matriz/Filial</label>
                                   <input type="text" class="form-control" maxlength="25" id="fil" name="fil"
                                        value="<?php echo (isset($_REQUEST['fil']) == false ? "" : $_REQUEST['fil']); ?>" />
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-10">
                                   <label>Endereço</label>
                                   <input type="text" class="form-control" maxlength="50" id="end" name="end"
                                        value="<?php echo (isset($_REQUEST['end']) == false ? "" : $_REQUEST['end']); ?>" />
                              </div>
                              <div class="col-md-2">
                                   <label>Número</label>
                                   <input type="text" class="form-control text-center" maxlength="6" id="num" name="num"
                                        value="<?php echo (isset($_REQUEST['num']) == false ? "" : $_REQUEST['num']); ?>" />
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-10">
                                   <label>Complemento</label>
                                   <input type="text" class="form-control" maxlength="50" id="com" name="com"
                                        value="<?php echo (isset($_REQUEST['com']) == false ? "" : $_REQUEST['com']); ?>" />
                              </div>
                              <div class="col-md-2"></div>
                         </div>
                         <div class="row">
                              <div class="col-md-6">
                                   <label>Bairro</label>
                                   <input type="text" class="form-control" maxlength="50" id="bai" name="bai"
                                        value="<?php echo (isset($_REQUEST['bai']) == false ? "" : $_REQUEST['bai']); ?>" />
                              </div>
                              <div class="col-md-5">
                                   <label>Cidade</label>
                                   <input type="text" class="form-control" maxlength="50" id="cid" name="cid"
                                        value="<?php echo (isset($_REQUEST['cid']) == false ? "" : $_REQUEST['cid']); ?>" />
                              </div>
                              <div class="col-md-1">
                                   <label>Estado</label>
                                   <input type="text" class="form-control" maxlength="2" id="est" name="est"
                                        value="<?php echo (isset($_REQUEST['est']) == false ? "" : $_REQUEST['est']); ?>" />
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-4">
                                   <label>Telefone</label>
                                   <input type="text" class="form-control" maxlength="15" id="tel" name="tel"
                                        value="<?php echo (isset($_REQUEST['tel']) == false ? "" : $_REQUEST['tel']); ?>" />
                              </div>
                              <div class="col-md-4"></div>
                              <div class="col-md-4">
                                   <label>Celular</label>
                                   <input type="text" class="form-control" maxlength="15" id="cel" name="cel"
                                        value="<?php echo (isset($_REQUEST['cel']) == false ? "" : $_REQUEST['cel']); ?>" />
                              </div>
                         </div>
                         <div class="row">
                              <div class="col-md-4">
                                   <label>E-Mail</label>
                                   <input type="email" class="form-control" maxlength="75" id="ema" name="ema"
                                        value="<?php echo (isset($_REQUEST['ema']) == false ? "" : $_REQUEST['ema']); ?>" />
                              </div>
                              <div class="col-md-4"></div>
                              <div class="col-md-4">
                                   <label>Contato</label>
                                   <input type="text" class="form-control" maxlength="50" id="con" name="con"
                                        value="<?php echo (isset($_REQUEST['con']) == false ? "" : $_REQUEST['con']); ?>" />
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
                                                  <th>Nome do Local</th>
                                                  <th>Endereço</th>
                                                  <th>Cidade</th>
                                                  <th>UF</th>
                                                  <th>Celular</th>
                                                  <th>Telefone</th>
                                                  <th>E-Mail</th>
                                             </tr>
                                        </thead>
                                        <tbody>
                                             <?php $ret = carrega_loc();  ?>
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
     $nro = acessa_reg('Select idlocal from tb_local order by idlocal desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idlocal'] + 1;
     }        
     return $cod;
}

function consiste_loc() {
     $sta = 0;
     if (trim($_REQUEST['des']) == "") {
          echo '<script>alert("Nome do Produto não pode estar em branco");</script>';
          return 1;
     }
     return $sta;
}

function ler_local(&$cha) {
     include_once "dados.php";
     $nro = acessa_reg('Select * from tb_local where idlocal = ' . $cha, $reg);
     if ($nro == 0 || $reg == false) {
          echo '<script>alert("Código da Função informada não cadastrada");</script>';
          $nro = 1;
     } else {
          $_REQUEST['sta'] = $reg['locstatus'];
          $_REQUEST['des'] = $reg['locrazao'];
          $_REQUEST['res'] = $reg['locfantasia'];
          $_REQUEST['cep'] = $reg['loccep'];
          $_REQUEST['fil'] = $reg['locfilial'];
          $_REQUEST['end'] = $reg['locendereco'];
          $_REQUEST['num'] = $reg['locnumeroend'];
          $_REQUEST['com'] = $reg['loccomplemento'];
          $_REQUEST['bai'] = $reg['locbairro'];
          $_REQUEST['cid'] = $reg['loccidade'];
          $_REQUEST['est'] = $reg['locestado'];
          $_REQUEST['cel'] = $reg['loccelular'];
          $_REQUEST['tel'] = $reg['loctelefone'];
          $_REQUEST['ema'] = $reg['locemail'];
          $_REQUEST['con'] = $reg['loccontato'];
     }
     return $cha;
}

function carrega_loc() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select * from tb_local  order by locrazao, idlocal";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a href="man-local.php?ope=2&cod=' . $lin['idlocal'] . '" title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a href="man-local.php?ope=3&cod=' . $lin['idlocal'] . '" title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          $txt .= '<td class="text-center">' . $lin['idlocal'] . '</td>';
          if ($lin['locstatus'] == 0) {$txt .= "<td>" . "Normal" . "</td>";}
          if ($lin['locstatus'] == 1) {$txt .= "<td>" . "Bloqueado" . "</td>";}
          if ($lin['locstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['locstatus'] == 3) {$txt .= "<td>" . "Cancelado" . "</td>";}
          $txt .= '<td>' . $lin['locrazao'] . '</td>';
          $txt .= '<td>' . $lin['locendereco'] . '</td>';
          $txt .= '<td>' . $lin['loccidade'] . '</td>';
          $txt .= '<td>' . $lin['locestado'] . '</td>';
          $txt .= '<td>' . $lin['loccelular'] . '</td>';
          $txt .= '<td>' . $lin['loctelefone'] . '</td>';
          $txt .= '<td>' . $lin['locemail'] . '</td>';
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function incluir_loc() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "insert into tb_local (";
     $sql .= "loctipo, ";
     $sql .= "locstatus, ";
     $sql .= "locrazao, ";
     $sql .= "locfantasia, ";
     $sql .= "locfilial, ";
     $sql .= "loccep, ";
     $sql .= "locendereco, ";
     $sql .= "locnumeroend, ";
     $sql .= "loccomplemento, ";
     $sql .= "locbairro, ";
     $sql .= "loccidade, ";
     $sql .= "locestado, ";
     $sql .= "loccelular, ";
     $sql .= "loctelefone, ";
     $sql .= "locemail, ";
     $sql .= "loccontato, ";
     $sql .= "keyinc, ";
     $sql .= "datinc ";
     $sql .= ") value ( ";
     $sql .= "'" . '1' . "',";
     $sql .= "'" . $_REQUEST['sta'] . "',";
     $sql .= "'" . trim($_REQUEST['des']) . "',";
     $sql .= "'" . trim($_REQUEST['res']) . "',";
     $sql .= "'" . trim($_REQUEST['fil']) . "',";
     $sql .= "'" . limpa_nro($_REQUEST['cep']) . "',";
     $sql .= "'" . trim($_REQUEST['end']) . "',";
     $sql .= "'" . limpa_nro($_REQUEST['num']) . "',";
     $sql .= "'" . trim($_REQUEST['com']) . "',";
     $sql .= "'" . trim($_REQUEST['bai']) . "',";
     $sql .= "'" . trim($_REQUEST['cid']) . "',";
     $sql .= "'" . trim($_REQUEST['est']) . "',";
     $sql .= "'" . trim($_REQUEST['cel']) . "',";
     $sql .= "'" . trim($_REQUEST['tel']) . "',";
     $sql .= "'" . trim($_REQUEST['ema']) . "',";
     $sql .= "'" . trim($_REQUEST['con']) . "',";
     $sql .= "'" . $_SESSION['wrkideusu'] . "',";
     $sql .= "'" . date("Y/m/d H:i:s") . "')";
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na gravação do registro solicitado !");</script>';
     }
     return $ret;
 }

 function alterar_loc() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "update tb_local set ";
     $sql .= "locstatus = '". $_REQUEST['sta'] . "', ";
     $sql .= "locrazao = '". trim($_REQUEST['des']) . "', ";
     $sql .= "locfantasia = '". trim($_REQUEST['res']) . "', ";
     $sql .= "locfilial = '". trim($_REQUEST['fil']) . "', ";
     $sql .= "loccep = '". limpa_nro($_REQUEST['cep']) . "', ";
     $sql .= "locendereco = '". trim($_REQUEST['end']) . "', ";
     $sql .= "locnumeroend = '". limpa_nro($_REQUEST['num']) . "', ";
     $sql .= "loccomplemento = '". trim($_REQUEST['com']) . "', ";
     $sql .= "locbairro = '". trim($_REQUEST['bai']) . "', ";
     $sql .= "loccidade = '". trim($_REQUEST['cid']) . "', ";
     $sql .= "locestado = '". trim($_REQUEST['est']) . "', ";
     $sql .= "loccelular = '". trim($_REQUEST['cel']) . "', ";     
     $sql .= "loctelefone = '". trim($_REQUEST['tel']) . "', ";
     $sql .= "locemail = '". trim($_REQUEST['ema']) . "', ";
     $sql .= "loccontato = '". trim($_REQUEST['con']) . "', ";
     $sql .= "keyalt = '" . $_SESSION['wrkideusu'] . "', ";
     $sql .= "datalt = '" . date("Y/m/d H:i:s") . "' ";
     $sql .= "where idlocal = " . $_SESSION['wrkcodreg'];
     $ret = comando_tab($sql, $nro, $ult, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na regravação do registro solicitado !");</script>';
     }
     return $ret;
}

function excluir_loc() {
     $ret = 0;
     include_once "dados.php";
     $sql  = "Delete from tb_local where idlocal = " . $_SESSION['wrkcodreg'] ;
     $ret = comando_tab($sql, $nro, $cha, $men);
     if ($ret == false) {
          print_r($sql);
          echo '<script>alert("Erro na exclusão do registro solicitado !");</script>';
     }
     return $ret;
}

?>

</html>